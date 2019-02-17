
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
        isEmptyObject,
    } = require('./utils');
    let bigObj,
        storeTemp = {};
    
    
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

    try {
        await readFile('./temp.json');
        storeTemp = fs.readFileSync('./temp.json', 'utf8') || {};
        storeTemp = JSON.parse(storeTemp);
    } catch {}

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

    if ([...yet_not_filtered].length && isEmptyObject(storeTemp)) {

        log('Need to add filters!!!!!')
        const arrayFromSet = [...yet_not_filtered];

        arrayFromSet[Symbol.asyncIterator] = async function* () {
            const stdin = process.openStdin();

            process.stdout.write('\n\n\n');
            process.stdout.write("type 'show_list' and have a look at info.log to see the available list names");
            process.stdout.write('add filter key to an existing field: <field> <filter_key1> | <filter_key2>... \n')
            process.stdout.write('create field and add fields: create!<field_name> <filter_key1> | <filter_key2>\n');

            for (const val of Object.values(this)) {
                const res = await new Promise((resolve, reject) => {
                    console.log('current item:', val)

                    stdin.addListener('data', (data) => {
                        data = data.toString().replace(/\n/, '')

                        if (data === 'show_list') {
                            showList(bigObj.filters);
                        } else {
                            return resolve([data, val]);
                        }
                        
                    });
                })
                yield res;
            }
        }

        for await (const [item, val] of arrayFromSet) {
            if (item.startsWith('temp')) {
                /**
                * Add link to temp_field without specifying any keywords.
                * This is rather useful when you can't use any keywords for a specific link, 
                * but you still want to add it to a certain list.
                * TODO: add link!
                * See {@link http://github...}
                * @type {String}
                */
                let temp_field = /temp\!(\w+)/.exec(item)[1];

                console.log('field', temp_field)

                const existingUrls = storeTemp[temp_field] || []
                existingUrls.push(val)

                storeTemp[temp_field] = existingUrls;
            } else {
                const spaceIndex = item.indexOf(' ');
                const field = item.substr(0, spaceIndex);
                const key = item.substr(spaceIndex + 1)
                    .split('|')
                    .map(key => createRegex(key.replace(/(^\s+)|(\s+$)/g, '')))

                addFilterKey([field, key], bigObj);
            }
        }

        updateJSON(bigObj, './config.json');
        updateJSON(storeTemp, './temp.json', false);
        log("updated!")

        process.stdout.write('\ndone!\n')
        process.exit(0)
    }
    
    for (const key of Object.keys(storeTemp)) {
        storeTemp[key] = [new Set(storeTemp[key])];
    }

    save(filtered_again, bigObj, storeTemp)
    log('\n==============================================\n');
})()



