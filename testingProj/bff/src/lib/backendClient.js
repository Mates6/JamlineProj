export async function callBackend(path, options = {}) {

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 5000);

    try{
        const response = await fetch(`http://backend:80/${path}`, { 
            signal: controller.signal, 
            ...options,
         });

         const raw = await response.text().catch(() => '');
         let data; 
         try{
            data = JSON.parse( raw);
         }  catch(err){
            data = {message: raw};
         }

         if(!response.ok){
            const error = new Error(data.message || 'Unknown error from backend');
            error.status = response.status;
            throw error;
         }

         return data;
    }  finally {
        clearTimeout(timeout);
    }
}