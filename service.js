const { ServiceWrapper, AmqpManager, Middlewares } = require("@molfar/service-chassis")
const path = require("path")

let service = new ServiceWrapper({
 	
    config: null,
    
    async onConfigure(config, resolve){
        
        this.config = config

        const serviceSetup = this.config.service.manticore ? this.config.service.manticore : require(path.resolve(__dirname,"./package.json")).manticore

        const { execute, initialize } = require("./src/manticore")(serviceSetup)

        await initialize()

        this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

       await this.consumer.use([
           Middlewares.Json.parse,
           Middlewares.Schema.validator(this.config.service.consume.message),
           Middlewares.Error.Log,
           Middlewares.Error.BreakChain,

            async (err, msg, next) => {
                try {
                    let m = msg.content
                    
                    let res = await execute(m)

                    console.log("DB RESPONSE", res )
                    msg.ack()
                }    
                catch(e){
                    console.log("ERROR", e.toString())
                }    
            }
       ])

       resolve({status: "configured"})
   
    },

   async onStart(data, resolve){
       this.consumer.start()
       resolve({status: "started"})	
    
    },

    async onStop(data, resolve){
       await this.consumer.close()
       resolve({status: "stoped"})
   }

})

service.start()