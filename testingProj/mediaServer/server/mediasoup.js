const mediasoup = require('mediasoup');


let router;

const transports = new Map();
const producers = new Map();
const consumers = new Map();  // was an array before

module.exports = async function (){
    const worker = await mediasoup.createWorker({
        rtcMinPort: 40000,
        rtcMaxPort: 40100 // tieto dva parametre su nepovinne, ale ak je to v dockeri, tak to je povinne, lebo docker by si ich nezmapoval
    });

    router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2 
            },
            {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000
            }
        ]
    });

    console.log('Mediasoup router initialized.');



    async function createTransport(clientId, direction){
        const transport = await router.createWebRtcTransport({
            //listenIps: [{ ip: '0.0.0.0', announcedIp: '62.197.239.149'}],
            listenIps: [{ ip: '0.0.0.0', announcedIp: 'host.docker.internal'}],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: 1000000
        });
        if(!transports.has(clientId)) transports.set(clientId, {});
        transports.get(clientId)[direction] = transport;

        console.log(`Created WebRTC transport for ${clientId} : ${transport.id}`);

        if(transport.tuple){
        console.log(transport.tuple.localPort);
        console.log(transport.tuple.localIp);
        console.log(transport.tuple.remotePort);
        }

        return transport;
    }

    async function handleConnectTransport(clientId, dtlsParameters, direction){
        const clientTransports = transports.get(clientId);
        if(!clientTransports) throw new Error(`No transports found for ${clientId}`);

        const transport = clientTransports[direction];
        if(!transport) throw new Error(`No ${direction} transport found for ${clientId}`);

        await transport.connect({dtlsParameters});
        console.log(`Transport connected for ${clientId}`);
    }

    async function handleProduce(clientId, direction, { kind, rtpParameters}){
        const clientTransports = transports.get(clientId); 

        if(!clientTransports) throw new Error(`No ${direction} transport found for: ${clientId}`);
        
        //const sendTransport = clientTransports[direction];
        const transport = clientTransports[direction];
        if(!transport) throw new Error(`No transport for direction ${direction} and client ${clientId}`);

        const producer = await transport.produce({ kind, rtpParameters});
        producers.set(producer.id, {producer, clientId});


        console.log(`${clientId} producing ${kind} (id: ${producer.id}) on this transport ${transport.id}`);


        producer.on('transportclose', () =>{
            console.log(`transport closed, deleting producer: ${producer.id}`);
            producers.delete(producer.id);
        });
        
        producer.on('close', () =>{
            console.log(`Closed, deleting producer ${producer.id}`);
            producer.delete(producer.id);
        });

        return producer;
    }


   /* async function handleConsume(clientId, direction, { rtpCapabilities }){
        const clientTransports = transports.get(clientId);
        if(!clientTransports) throw new Error(`No ${direction} transport found for ${clientId}`);

        const transport = clientTransports[direction];
        if(!transport) throw new Error(`No transport for direction ${direction} and client ${clientId}`);
*/
       /* console.log("Producers Map:");
        for (const [id, value] of producers.entries()) {
            console.log("ID:", id);     useless
            console.log("Value:", value);
            console.log("Type of value:", typeof value);
        }*/

      /*  const producerList = Array.from(producers.values()).filter(id => id.clientId !== clientId).map(p => p.producer); 
        
        console.log('Users id:', clientId);
        console.log("=== PRODUCER LIST ===");
        producerList.forEach((p, index) => {
            console.log(`#${index + 1}: kind=${p.kind}, id=${p.id}, client=${producers.get(p.id)?.clientId}`);
        });
        console.log("=====================");

        
        if(producerList.length === 0){
            console.warn('No producer available to consume');
            return;
        }*/
        
       // const producer = producerList; useless


       // console.log("ProducerList length: ",producerList.length);

        //console.log("Chosen producer: ", producer); useless

        //const consumers = []; useless
 
      /*  for(const producer  of producerList){
            //if (producer.clientId === clientId) continue; useless

            if(!router.canConsume({producerId: producer.id, rtpCapabilities})) continue;

            const consumer = await transport.consume({
                producerId: producer.id,
                rtpCapabilities,
                paused: false
            });

            consumers.push(consumer);
        }*/
 
       /* if(!router.canConsume({ producerId: producer.id, rtpCapabilities})){
           throw new Error("Cannot consume - Incompatible RTP capabilities!"); useless
         
        }   
        
        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities, useless
            paused: false
        });

        console.log(`${clientId} consuming from producer ${producer.id}`); useless


        consumer.on('transportclose', () =>{
            console.log(`Transport closed, consumer: ${consumer.id}`); useless
        });

        consumer.on('close', () =>{
            console.log(`Consumer ${consumer.id} closed`); useless
        });   */

       // return consumers;
    //}

    async function handleConsume(clientId, direction, { producerId, rtpCapabilities}){
    const clientTransports = transports.get(clientId);
        if(!clientTransports)
            throw new Error(`No transport for ${clientId}`);

        const transport = clientTransports[direction];

        const consumerList = []; // toto je pre klienta
        const consumerListforServer = []; // toto je pre server, aby fungoval disconnect

        const producerList = Array.from(producers.values())
                .filter(p => p.clientId !== clientId)
                .map(p => p.producer);


        for (const producer of producerList){
            if(!router.canConsume({ producerId: producer.id, rtpCapabilities})) continue;

            const consumer = await transport.consume({
                producerId: producer.id,
                rtpCapabilities,
                paused: false
            });

            if(!consumers.has(clientId)) consumers.set(clientId, []);
            consumers.get(clientId).push(consumer);

            consumerListforServer.push(consumer);

            consumerList.push({
                id: consumer.id,
                producerId: producer.id,
                kind: producer.kind,
                rtpParameters: consumer.rtpParameters
            });
        }

        return{ list: consumerList, consumers: consumerListforServer };

   }

    return { router, createTransport, handleConnectTransport ,handleProduce, handleConsume};
};