import express from 'express';
import https from 'http';
import {WebSocketServer} from 'ws';
import createMediasoupServer from './mediasoup.js';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import { group } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/*
const tls = {
    key: fs.readFileSync(path.resolve(__dirname, 'cert/privkey1.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert/fullchain1.pem')),
    ca: fs.readFileSync(path.resolve(__dirname, 'cert/chain1.pem')), toto nepouzivat, to je nginx robota xd
}*/


const app = express();
const server = https.createServer(app);
const wss = new WebSocketServer({ server});
console.log(wss);

app.use(express.static('client'));

const clients = new Map();

let rooms = {};
const clientRooms = new Map();

const groupObservers = {};

const textChatClientsGroups = new Map(); // <groupId, Set<clientId>>

const chatClients = new Map(); // <clientId, {ws, groupId}>

const chatClientsUsername = new Map(); // <clientId, username>


(async () => {
  const { router, createTransport, handleConnectTransport, handleProduce, handleConsume } =
    await createMediasoupServer();

  console.log('Mediasoup server ready.');

  wss.on('connection', (ws) => {
    let clientId = null;

    ws.on('message', async (message) => {
      let msg;
      try {
        msg = JSON.parse(message);
        console.log(msg);
      } catch (err) {
        console.error('Invalid JSON from client:', message);
        return;
      }

      switch (msg.action) {

        case 'syncRooms':{
            const{ groupRooms } = msg.data;


            groupRooms.forEach(room =>{
              console.log('groupRooms: ', room.id, ' Room name: ', room.name);
              let id = room.id;

              if(!rooms[id]){
                rooms[id] = {
                id,
                name: room.name,
                users: [],
                usernames: [],
                mediasoup: null,
                transports: new Map(), // aby som nezabudol na strukturu <clientId, {sendTran, recvTran, Producers: [], Consumers: []}>
                producers: new Map(), // <clientId, Producers[]>
                consumers: new Map, // <clientId, Consumers[]>
              };

              }
            });
            console.log('Synced rooms with frontend: ',rooms);
            ws.send(JSON.stringify({
              action: 'roomsUpdated',
              rooms: rooms
            }))

            break;
        } 

        case 'observeGroup':{
          const groupId = msg.groupId;

          if(!groupObservers[groupId]){
            groupObservers[groupId] = new Set();
          }

          groupObservers[groupId].add(clientId);

          console.log(`Client: ${clientId} started observing group: ${groupId}`);
          break;

        }

        case 'stopObservingGroup': {
          const groupId = msg.groupId;

          if (groupObservers[groupId]) {
            groupObservers[groupId].delete(clientId);
          }

          console.log(`Client ${clientId} stopped observing group ${groupId}`);
          break;
        }


      

        //vytvorenie miestnosti 
        case 'createRoom':{
          const id = Math.random().toString(36).slice(2,9);
          console.log(msg);

          //const id= msg.roomId || msg.data.roomId;

          if(!msg.name){
            ws.send(JSON.stringify({
              action: 'error',
              data: 'no room name!'
            }))
            return;
          }

          if(msg.name.length > 30){
            ws.send(JSON.stringify({
              action: 'Hellnaw',
              data: 'Calm down Peter, we\'re your friends'
            }));
            return;
          }

          rooms[id] = {
            id,
            name: msg.name,
            users: [],
            usernames: [],
            mediasoup: null,
            transports: new Map(), // aby som nezabudol na strukturu <clientId, {sendTran, recvTran, Producers: [], Consumers: []}>
            producers: new Map(), // <clientId, Producers[]>
            consumers: new Map, // <clientId, Consumers[]>
          };
          //console.log("WSS clients: ",wss.clients);
          console.log("Rooms: ",rooms);

          wss.clients.forEach(client =>{
              client.send(JSON.stringify({
                action: "roomsUpdated",
                rooms: rooms
              }));
          });

          break;
        }

        //zisaknie miestnosti na zaciatku
        case 'getRooms': {

          ws.send(JSON.stringify({
            action: "roomsUpdated",
            rooms: rooms
          }));

          break;
        }

        // pripojenie do miestnosti
        case 'joinRoom': {

          console.log("JOIN ROOM: message", msg);
          const roomId = msg.roomId || msg.data.roomId;
          console.log("JOIN ROOM: roomId", roomId);
          const room = rooms[roomId];
          console.log("JOIN ROOM: room", room);
          if(!room) return;
          const username = msg.data.username || clientId;
          
          // ak miestnost nema router, tak ho vytvorime
          if(!room.mediasoup){
            room.mediasoup = await createMediasoupServer();
            console.log('JOIN ROOM: MediaSoupServer created');
          }
          
          

          Object.values(rooms).forEach(room => {
            if (room.users.includes(clientId) && room.id !== roomId) {
            room.users = room.users.filter(u => u !== clientId);
            console.log(`Client ${clientId} removed from room ${room.id}`);
          }
          });

          Object.values(rooms).forEach(room => {
            if (room.usernames.includes(username) && room.id !== roomId) {
            room.usernames = room.usernames.filter(u => u !== username);
            console.log(`User ${username} removed from room ${room.id}`);
          }
          });
          

          if(!rooms[roomId].users.includes(clientId)){
            console.log('JOIN ROOM:  user', clientId);
          rooms[roomId].users.push(clientId);
          rooms[roomId].usernames.push(username);
          clientRooms.set(clientId, roomId);
          console.log("JOIN ROOM: all rooms", rooms);
          }
          else
            return;
          
          ws.send(JSON.stringify({
            action: 'joinedRoom',
            roomId,
            rtpCapabilities: room.mediasoup.router.rtpCapabilities
          }));

          wss.clients.forEach(client =>{
            client.send(JSON.stringify({
              action: 'roomsUpdated',
              rooms: rooms
            }));
          });

          break;
          }


          case 'disconnect':{
            if(!clientRooms.has(clientId))
              return;

             const roomId = clientRooms.get(clientId);
              if(roomId && rooms[roomId]){
                const room = rooms[roomId];


            const transports = room.transports.get(clientId);
            if(transports){
              if(transports.sendTransport) transports.sendTransport.close();
              if(transports.recvTransport) transports.recvTransport.close();
              room.transports.delete(clientId);
            }

            const producers = room.producers.get(clientId) || [];
            console.log('const producers: ', producers);
            producers.forEach(p => p.close());
            room.producers.delete(clientId);

            const consumers = room.consumers.get(clientId) || [];
            console.log('const consumers: ', consumers);
            consumers.forEach(c => c.close());
            room.consumers.delete(clientId);
            const index = room.users.indexOf(clientId);
            room.users = room.users.filter(u => u !== clientId);
            const username = room.usernames[index];
        
            room.usernames = room.usernames.filter(u => u !== username);
      }
            clientRooms.delete(clientId);
            clients.delete(clientId); // toto by som mal dat prec pokial chcem nechat WS connection i guess ? 
                                      // mylim som sa, musi to tu byt, inak user co sa odpoji a druhy tam ostane, znova sa napoji a ten druhy sa teraz odpoji, tak
                                      // mu neposle action userLeft ani nic ine....

          wss.clients.forEach(client =>{
              client.send(JSON.stringify({
                action: "roomsUpdated",
                rooms: rooms
              }));
          });

          for(const user of rooms[roomId].users){
              const wsOther = clients.get(user);
              console.log("Sending userLeft to:", user, "WS readyState:", wsOther);
              if(wsOther){
                try{
                wsOther.send(JSON.stringify({
                  action: 'userLeft',
                  data:{clientId}
                }));
                console.log("Sent userLeft to:", user);
              } catch(err){
                console.error('Failed to send userLeft to', user, err);
              }
              } else{
                console.log('No ws found for user: ', user);
              }
          }

          console.log(rooms);

          ws.send(JSON.stringify({
            action: 'disconnect',
            data: {clientId}
          }));

          break;
        }

        











        // Pridanie klienta
        case 'register':
          clientId = msg.clientId || msg.data.clientId;

          const oldWs = clients.get(clientId);
     //     console.log(`oldWs for client ${clientId}: `, oldWs);
          if(oldWs && oldWs !== ws){
            console.log(`Client ${clientId} already has a WebSocket connection. Closing old connection and replacing with new one.`);
            try{
  //            console.log(`Oldws: `, oldWs);
              oldWs.close();
              console.log(`Old WebSocket for client ${clientId} closed successfully.`);
            }
            catch(err){
              console.warn(`Error while closing old Websocket for client ${clientId}: ${err}`);
            }
          }
          clients.set(clientId, ws);
          console.log(`Client registered: ${clientId}`);
        //  console.log(`Current clients: ${[...clients.keys()]}`);
          break;

        // Get request o RtpCapabilities
        case 'getRouterRtpCapabilities':
          ws.send(
            JSON.stringify({
              action: 'routerRtpCapabilities',
              data: router.rtpCapabilities,
            })
          );
          console.log(`[${clientId}] Requested router RTP capabilities.`);
          break;

        // Vytvorenie send transportu
        case 'createTransport':
          try {
            //console.log("CreateTransport: message: ", msg);
            const clientId=msg.data.clientId

            console.log("CreateTransport: All known rooms: ", rooms);
            console.log("CreateTransport: ClientId: ", clientId);
            //console.log("CreateTransport: message: ", msg);
            console.log("CreateTransport: ClientRooms: ", clientRooms);

            const roomId = clientRooms.get(clientId);
            if (!roomId || !rooms[roomId]) {
             console.error(`[${clientId}] No room found`);
             return;
            }
            const room = rooms[roomId];

            
            
            const transport = await createTransport(clientId, 'send');

            if(!room.transports.has(clientId)){
              room.transports.set(clientId, {sendTransport: null, recvTransport: null});
            }

            room.transports.get(clientId).sendTransport = transport;


            console.log(`[${clientId}] Created SEND transport ${transport.id}`);

            console.log("Create Transport: transports: ", room);

            ws.send(
              JSON.stringify({
                action: 'transportCreated',
                data: {
                  direction: 'send',
                  id: transport.id,
                  iceParameters: transport.iceParameters,
                  iceCandidates: transport.iceCandidates,
                  dtlsParameters: transport.dtlsParameters,
                },
              })
            );
          } catch (err) {
            console.error(`[${clientId}] Failed to create send transport:`, err);
            ws.send(
              JSON.stringify({
                action: 'error',
                message: 'Failed to create send transport',
              })
            );
          }
          break;

        // Vytvorenie recv transportu
        case 'createRecvTransport':
          try {

            const roomId = clientRooms.get(clientId);
            if (!roomId || !rooms[roomId]) {
             console.error(`[${clientId}] No room found`);
             return;
            }
            const room = rooms[roomId];
            
            const transport = await createTransport(clientId, 'recv');

            if(!room.transports.has(clientId)){
              room.transports.set(clientId, {sendTransport: null, recvTransport: null});
            }

            room.transports.get(clientId).recvTransport = transport;
            
            console.log(`[${clientId}] Created RECV transport ${transport.id}`);

            ws.send(
              JSON.stringify({
                action: 'transportCreated',
                data: {
                  direction: 'recv',
                  id: transport.id,
                  iceParameters: transport.iceParameters,
                  iceCandidates: transport.iceCandidates,
                  dtlsParameters: transport.dtlsParameters,
                },
              })
            );
          } catch (err) {
            console.error(`[${clientId}] Failed to create recv transport:`, err);
            ws.send(
              JSON.stringify({
                action: 'error',
                message: 'Failed to create recv transport',
              })
            );
          }
          break;

        // pripojenie
        case 'connectTransport':
          //console.log('Connect Transport: ', msg);

          if (!msg.data || !msg.data.dtlsParameters) {
            console.warn(`[${clientId}] Missing DTLS Parameters.`);
            return;
          }

          try {
            const direction = msg.direction || msg.data.direction || 'send';
            await handleConnectTransport(clientId, msg.data.dtlsParameters, direction);
            console.log(`[${clientId}] Connected transport (${direction}).`);
          } catch (err) {
            console.error(`[${clientId}] Failed to connect transport:`, err);
          }
          break;

        // Produce
        case 'produce':
          try {
            //console.log("Produce: message ", msg);

          //const { kind, rtpParameters } = msg.data;
          console.log(`[${clientId}] Producing track (${msg.data.kind})...`);
          const producer = await handleProduce(clientId, 'send', msg.data);

           
          const roomId = clientRooms.get(clientId);
            if (!roomId || !rooms[roomId]) {
             console.error(`[${clientId}] No room found`);
             return;
            }
          const room = rooms[roomId];
          

          const transport = room.transports.get(clientId)?.sendTransport; 

           if(!transport){
            console.error(`${clientId} No sendTransport found`);
            return;
           }

          //const producer = await transport.produce({kind, rtpParameters});

           if(!room.producers.has(clientId)){
              room.producers.set(clientId, []);
           }

           const producerData = {
            producerId: producer.id,
            kind: producer.kind,
            clientId: clientId
           }
           room.producers.get(clientId).push(producer);

           console.log("Action produce: ln-370: ", rooms); 
           console.log("Produce: ", clientId ,producer.id, producer.kind, producer.rtpParameters );
            ws.send(
              JSON.stringify({
                action: 'produced',
                data: {
                  clientId: clientId,
                  id: producer.id,
                  kind: producer.kind,
                  rtpParameters: producer.rtpParameters,
                },
              }));
 
            for(const otherClientId of room.users) {
              if(otherClientId !== clientId && clients.has(otherClientId)){
           //     console.log("TETETEST Notifying other client about new producer: ", otherClientId);
                const test = clients.get(otherClientId);
                clients.get(otherClientId).send(JSON.stringify({
                  action: 'newProducer',
                  producerId: producer.id,
                  kind: producer.kind,
                  clientId,
                  rooms: rooms,
                  test
                }));
              }
            }  

          } catch (err) {
            console.error(`[${clientId}] Failed to produce:`, err);
            ws.send(
              JSON.stringify({
                action: 'error',
                message: 'Failed to produce',
              })
            );
          }
          break;

        // Consume
        case 'consume':
            console.log(`${clientId} consumer request `, msg.data);
          try {

           const roomId = clientRooms.get(clientId);
            if (!roomId || !rooms[roomId]) {
             console.error(`[${clientId}] No room found`);
             return;
            }
            const room = rooms[roomId];

            console.log("All transports in the room: ", room);


            const {list, consumers} = await handleConsume(clientId, 'recv', msg.data);
            console.log("Everything in const consumer HENLO: ", consumers)

            if (!consumers || consumers.length === 0) {
              ws.send(
                JSON.stringify({
                  action: 'error',
                  message: 'No available producer to consume.',
                })
              );
              return;
            }

            if (!room.consumers.has(clientId)){
              room.consumers.set(clientId, []);
            }

            console.log(`const consumers for [${clientId}]: ${consumers}`);

            room.consumers.get(clientId).push(...consumers);

            console.log("Consumers in room: ", room.consumers );
            console.log("Producers in room: ", room.producers );


           /* console.log("Everything mandatory :");
            console.log(
            consumers.map(c => ({
              id: c.id,
              producerId: c.producerId,
              kind: c.kind,
              rtpParameters: c.rtpParameters
              }))
            );*/

            const consumersData = list.map(c =>{
               let producerClientId = null;

               for(const [otherClientId, producers] of room.producers){
                  if(producers.some(p => p.id === c.producerId)){
                    producerClientId = otherClientId;
                    break;
                  }
               }

               const index = room.users.indexOf(producerClientId);
               const username = room.usernames[index];

               return{
                clientId: clientId,
                id: c.id,
                producerId: c.producerId,
                kind: c.kind,
                rtpParameters: c.rtpParameters,
                anotherId: producerClientId,
                username: username
               };
            });

           /* const consumersData = [];

            for( const[id, consumersMap] of room.consumers){
              for( const consumer of consumersMap){
                let producerClientId = null;
                for(const [clientId, producers] of room.producers){
                  if(producers.some(p => p.id === consumer.producerId)){
                    producerClientId = clientId;
                    break;
                  }
                }
                    consumersData.push({
                      clientId: id,
                      id: consumer.id,
                      producerId: consumer.producerId,
                      kind: consumer.kind,
                      rtpParameters: consumer.rtpParameters,
                      anotherId: producerClientId
                    })
              }
            }*/

            ws.send(
              JSON.stringify({
                action: 'consumed',
                roomId: roomId,
                data: consumersData
                /*clientId: clientId,
                data: consumers.map(c => ({
                  id: c.id,
                  producerId: c.producerId,
                  kind: c.kind,
                  rtpParameters: c.rtpParameters
                }))*/
              }));

            console.log(`[${clientId}] Consumer created: ${consumers.map(c => c.id).join(', ')}`);
          } catch (err) {
            console.error(`[${clientId}] Failed to consume:`, err);
            ws.send(
              JSON.stringify({
                action: 'error',
                message: 'Failed to consume',
              })
            );
          }
          break;


          case 'getProducers':{
            const producersData = [];
            console.log("Get Producers action: ", msg);
            const roomId = clientRooms.get(msg.data.clientId);
            const room = rooms[roomId];
            if(!room) return; 
            console.log("Room id to get Producers: ", roomId);
            //console.log(`Producers in this room: [${roomId}]: `, rooms[roomId].producers); bohuzial nepriehladne, lebo nemohol by som potomm closenut streamy

            for( const [clientId, producersMap] of room.producers){
              for(const producer of producersMap){
                producersData.push({
                  producerId: producer.id,
                  kind: producer.kind,
                  clientId
                });
              }
            }

            console.log("Producers data: ", producersData);

            ws.send(JSON.stringify({ 
              action: 'consumeExistingProducers',
              data: producersData
            }))
          };

          case 'muteStatus':{
            if(!msg.data){
              console.log("MUTE data: ",msg.data);
              console.error('Mute: Something is missing !');
              break;
            }
            const {clientId, muted, groupId} = msg.data;
            
            const roomId = clientRooms.get(clientId);
            if(!roomId) {
              console.error('Mute: Room not found!');
              break;
            }

            const room = rooms[roomId];

            for(const otherClientId  of room.users){
              if(otherClientId !== clientId && clients.has(otherClientId)){
                clients.get(otherClientId).send(JSON.stringify({
                  action: 'muteStatus',
                  data: { clientId, muted}
                }))
              }
            }


            if(groupObservers[groupId]){
              for(const observerId of groupObservers[groupId]){
                clients.get(observerId)?.send(JSON.stringify({
                  action: 'remoteMuteStatus',
                  data: { clientId, muted}
                }))
              }
            }

            break;
          }

          case 'camStatus':{
            if(!msg.data){
              console.log("CAM data: ", msg.data);
              console.error('CAM: Something is missing !');
              break;
            }
            const {clientId, cam} = msg.data;
            
            const roomId = clientRooms.get(clientId);
            if(!roomId) {
              console.error('Mute: Room not found!');
              break;
            }

            const room = rooms[roomId];

            for(const otherClientId  of room.users){
              if(otherClientId !== clientId && clients.has(otherClientId)){
                clients.get(otherClientId).send(JSON.stringify({
                  action: 'camStatus',
                  data: { clientId, cam}
                }))
              }
            }

            break;
          }


          //TEXT CHAT LOGIC STARTS HERE


          // musime pridat klienta do pola, aby sme potom mohli posielat spravy v ramci skupiny, lebo nechceme posielat spravy vsetkym klientom, ale len tym, ktori su v danej skupine
          case 'registerTextChatClient':{
              const {clientId, username ,groupId} = msg.data;
              if(!textChatClientsGroups.has(groupId)){
                textChatClientsGroups.set(groupId, new Set());
              }
              textChatClientsGroups.get(groupId).add(clientId);
              chatClients.set(clientId, ws);
              chatClientsUsername.set(clientId, username);

              console.log(`Client ${clientId} is now recieveing texts from group ${groupId}`);
              console.log('Current text chat clients groups: ', textChatClientsGroups);
              break;
          }

          case 'sendMessage':{
            const {clientId, message, groupId} = msg.data;
            console.log(`Client: ${clientId} has sent a message: ${message} in group ${groupId}`);

            // Posleme spravu iba klientom, ktori su v danej skupine
            const groupClients = textChatClientsGroups.get(groupId);
            console.log('Group clients to receive message:', groupClients);
            const time = getTime();

            if(groupClients){
              const senderUsername = chatClientsUsername.get(clientId)
              if(!senderUsername){
                console.error(`Username not found for client ${clientId}`);
                break ;
              }
              for(const client of groupClients){
                if(chatClients.has(client)){
                  chatClients.get(client).send(JSON.stringify({
                    action: 'receiveMessage',
                    data: { clientId, username: senderUsername, message, groupId, time }
                  }));
                }
              }
            }
            break;
          }

          case 'leaveTextChat':{
            const {clientId, groupId} = msg.data;
            console.log(`YOO Client ${clientId} is leaving text chat of group ${groupId}`);

            if (textChatClientsGroups.has(groupId)){
              textChatClientsGroups.get(groupId).delete(clientId);

              console.log(`Client ${clientId} has left text chat of group ${groupId}`);
            }
            else
              console.warn(`Group ${groupId} not found when client ${clientId} tried to leave text chat`);
            
            if(textChatClientsGroups.get(groupId)?.size === 0)
              textChatClientsGroups.delete(groupId);
            break;
          }

        default:
          console.warn(`[${clientId}] Unknown action: ${msg.action}`);
          break;
      }
    });

    // odpojenie klienta nebolo to dobre spravene, zacal som nanovo, ale nechal som to tu, pre istotu :D
  /*  ws.on('close', () => {
      console.log(`Client ${clientId} disconnected`);
      const roomId = clientRooms.get(clientId);
      if(roomId && rooms[roomId]){
        const room = rooms[roomId];


        const transports = room.transports.get(clientId);
        if(transports){
          if(transports.sendTransport) transports.sendTransport.close();
          if(transports.recvTransport) transports.recvTransport.close();
          room.transports.delete(clientId);
        }

        const producers = room.producers.get(clientId) || [];
        producers.forEach(p => p.close());
        room.producers.delete(clientId);

        const consumers = room.consumers.get(clientId) || [];
        consumers.forEach(c => c.close()); // nasiel som error c.close is not a function to potom este treba fixnut
        room.consumers.delete(clientId);

        room.users = room.users.filter(u => u !== clientId);

        console.log('Users in room after closing tab: ', rooms[roomId]?.users);

        for (const user of rooms[roomId].users) {
          clients.get(user)?.send(JSON.stringify({
            action: 'userLeft',
            data: { clientId }
          }));
        }

      //poslat ostatnym, ze user sa odpojil, aby sme mohli aktualizovat UI 
      }

       // if(!rooms[roomId]) return; 

      clientRooms.delete(clientId);
      clients.delete(clientId);

    });*/
ws.on('close', () => {
  console.log(`Client ${clientId} disconnected`);

  const roomId = clientRooms.get(clientId);
  if (!roomId) {
    clients.delete(clientId);
    return;
  }

  const room = rooms[roomId];
  if (!room) {
    clientRooms.delete(clientId);
    clients.delete(clientId);
    return;
  }

  // ulozim ostatnych userov pred odstranenim
  const otherUsers = room.users.filter(u => u !== clientId);

  // transporty
  const transports = room.transports.get(clientId);
  if (transports) {
    transports.sendTransport?.close();
    transports.recvTransport?.close();
    room.transports.delete(clientId);
  }

  // producers
  room.producers.get(clientId)?.forEach(p => p.close());
  room.producers.delete(clientId);

  // consumers
  room.consumers.get(clientId)?.forEach(c => {
    if (c && typeof c.close === 'function') c.close();
  });
  room.consumers.delete(clientId);

  // odstranenie username
  const index = room.users.indexOf(clientId);
  const username = room.usernames[index];
  room.usernames = room.usernames.filter(u => u !== username);

  // odstranenie usera z miestnosti
  room.users = otherUsers;
  const usernameIndex = room.usernames.indexOf(clientId);
  if (usernameIndex !== -1) room.usernames.splice(usernameIndex, 1);

  // notify ostatných
  for (const user of otherUsers) {
    clients.get(user)?.send(JSON.stringify({
      action: 'userLeft',
      data: { clientId }
    }));
  }

  // cleanup maps
  clientRooms.delete(clientId);
  clients.delete(clientId);
});

    ws.on('error', (err) => {
      console.error(`[${clientId}] WebSocket error:`, err);
    });
  });

  server.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
  });
})();

function getTime() {
  const d = new Date();

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes} ${day}.${month}.${year}`;
}

function cleanupUserFromRoom(clientId){
  if (!clientRooms.has(clientId)) return;

  const roomId = clientRooms.get(clientId);
  const room = rooms[roomId];
  if (!room) return;

  const transports = room.transports.get(clientId);
  if (transports) {
    transports.sendTransport?.close();
    transports.recvTransport?.close();
    room.transports.delete(clientId);
  }

  const producers = room.producers.get(clientId) || [];
  producers.forEach(p => p.close());
  room.producers.delete(clientId);

  const consumers = room.consumers.get(clientId) || [];
  consumers.forEach(c => c.close());
  room.consumers.delete(clientId);

  const index = room.users.indexOf(clientId);
  const username = room.usernames[index];
  room.usernames = room.usernames.filter(u => u !== username);

  room.users = room.users.filter(u => u !== clientId);

  clientRooms.delete(clientId);
}
