const { getClient, execute, formatter } = require('service-manti')

let client
let config
let max_id = 1

const worker = async (json) => {
    let data = `insert into molfar values(${max_id++}, '${json.scraper.message.text}', ${new Date(json.scraper.message.publishedAt).getTime()}, '${formatter(json)}');`
	let result = await execute(data, client)
	return result;
}

let initialize = async() => {
    client = getClient(config.url)
    const response = await execute("select max(id) as max_id from molfar;",client)
    if(response[0]['data'][0] && response[0]['data'][0]['max_id']){
        max_id = response[0]['data'][0]['max_id'] + 1
    }
}

module.exports =  conf => {
	config = conf
	return {
		initialize,
		execute: worker
	}	 
}