
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
    } = require('./utils');
    let bigObj,
        trello;


    const goodToGo = await new Promise((resolve, reject) => {
        fs.access('./trello.json', async (err, _) => {
            if (err) {
                console.log('generating lists..');
                const listsArr = require('./config');
                // await generateLists(listsArr, '5c57ece4c3bca92675ef4c91');
                await generateLists(listsArr, process.env.idBoard);

                console.log('lists generated. now adding fields to json file..')

                const tempTrelloObj = {};
                (await getTrelloInfo())
                .forEach(({
                    name,
                    id
                }) => {
                    tempTrelloObj[`${name}`] = location_info(id, process.env.idBoard);
                });

                updateJSON(tempTrelloObj, './trello.json', false);
                resolve('OK!');
            }

            trello = fs.readFileSync('./trello.json', 'utf8');
            trello = JSON.parse(trello)
            resolve('OK');
        });
    });
    
    fs.access('./config.json', (err, _) => {
        if (err) {
            const filters = require('./config')

            bigObj = {
                trello,
                filters: filters.map(convertToJSON)
            };

            fs.writeFileSync('./config.json', JSON.stringify(bigObj));
        }
        // File already exists
        bigObj = fs.readFileSync('./config.json', 'utf8');
        bigObj = JSON.parse(bigObj)
        bigObj.filters = bigObj.filters.map(parseJSON)
    })

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
            await addFilterKey(item, bigObj, trello)
        }

        updateJSON(bigObj, './config.json');
        updateJSON(trello, './trello.json', false);
        log("updated!")

        process.stdout.write('\ndone!\n')
        process.exit(0)
    }

    save(filtered_again, trello)
    log('\n==============================================\n');
})()



