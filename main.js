
(void 0, async () => {
    require('dotenv').config();
    const fs = require('fs')
    const log = require('./log');
    const { getTrelloInfo, generateLists } = require('./utils/crud.js');
    const {
        parseJSON,
        createRegex,
        filterResults,
        results,
        save,
        addFilterKey,
        convertToJSON,
        getUnfilteredLinks,
        updateJSON,
        location_info,
        showList,
        readFile,
    } = require('./utils');
    let bigObj;
    
    
    try {
        await readFile('./config.json');
    } catch {

        console.log('generating lists..');
        const filters = require('./config')
        await generateLists(filters, process.env.idBoard);

        console.log('lists generated. now adding fields to json file..')

        const tempTrelloObj = {};
        (await getTrelloInfo())
        .forEach(({
            name,
            id
        }) => {
            tempTrelloObj[`${name}`] = location_info(id, process.env.idBoard);
        });


        bigObj = {
            trello: tempTrelloObj,
            filters: filters.map(convertToJSON)
        };

        fs.writeFileSync('./config.json', JSON.stringify(bigObj));
    } finally {

        // File already exists
        bigObj = fs.readFileSync('./config.json', 'utf8');
        bigObj = JSON.parse(bigObj)
        bigObj.filters = bigObj.filters.map(parseJSON)
    }

    // ==========================================================

    /* 
    This could be used to get distinct links, but it's highly inefficient
    const newLink = /(https:\/\/\S+\/[a-z-0-9\?=]+-+\d+-+)(?!.*\1)/gs;

    Here's why: https://regex101.com/r/5tz37k/4
    */

    const links = await getUnfilteredLinks();
    const filteredLinks = filterResults(links);


    const {
        filtered: filtered_again,
        unfiltered: yet_not_filtered
    } = results(filteredLinks, bigObj.filters)

    if ([...yet_not_filtered].length) {

        log('Need to add filters!!!!!')
        const arrayFromSet = [...yet_not_filtered];

        arrayFromSet[Symbol.asyncIterator] = async function* () {
            const stdin = process.openStdin();

            process.stdout.write('\n\n\n');
            process.stdout.write("type 'show_list' and have a look at info.log to see the available list names");
            process.stdout.write('add filter key to an existing field: <field> <filter_key1> | <filter_key2>... \n')
            process.stdout.write('create field and add fields: create!<field_name> <filter_key1> | <filter_key2>');

            for (const [key, val] of Object.entries(this)) {
                const res = await new Promise((resolve, reject) => {
                    console.log('current item:', val)

                    stdin.addListener('data', (data) => {
                        data = data.toString().replace(/\n/, '')

                        if (data === 'show_list') {
                            showList(bigObj.filters);
                        } else {
                            const spaceIndex = data.indexOf(' ');
                            const field = data.substr(0, spaceIndex);
                            const key = data.substr(spaceIndex + 1)
                                .split('|')
                                .map(key => createRegex(key.replace(/(^\s+)|(\s+$)/g, '')))

                            resolve([field, key]);
                        }
                    });
                })

                yield res;
            }
        }

        for await (const item of arrayFromSet) {
            console.log(item)
            await addFilterKey(item, bigObj)
        }

        updateJSON(bigObj, './config.json');
        // updateJSON(trello, './trello.json', false);
        log("updated!")

        process.stdout.write('\ndone!\n')
        process.exit(0)
    }

    save(filtered_again, bigObj)
    log('\n==============================================\n');
})()



