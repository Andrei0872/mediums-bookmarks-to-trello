const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const log = require('../log');
const readline = require('readline');
const { addList } = require('./crud');

// Needed when you want to add a new card to Trello 
const req_options = {
    token: process.env.tokenTrello,
    pos: 65535,
    closed: false,
    idLabels: [],
    idMembers: [],
    dateLastActivity: 1547258041135
}

const trello_headers = {
    cookie: process.env.cookieTrello,
    'Content-Type': 'application/json'
}

const medium_headers = {
    cookie: process.env.cookieMedium,
    'X-XSRF-TOKEN': process.env.tokenMedium,
}

/**
 * When reading from `config.json`, each object from the `filters` array
 * will have the keywords from the `key` field converted to regular expressions
 * 
 * @example
 * {"name":"nuxt","key":"[\"/nuxt/\",\"/nuxt.js/\"]","items":{}}
 * returns { name: 'nuxt', key: [/nuxt/, /nuxt.js/] items: Set {} }
 * 
 * @param {Object} obj - the config Object (bigObj)
 */
function parseJSON(obj) {
    return {
        ...obj,
        key: JSON.parse(obj.key).map(k => createRegex(k.replace(/(^\/)|(\/$)/g, ''))),
        items: new Set()
    }
}

// ==========================================================

/**
 * Update a specific JSON file
 * 
 * @param {Object} obj 
 * @param {String} file 
 * @param {Boolean} needsMap - used when the callee is bigObject 
 */
function updateJSON(obj, file, needsMap = true) {
    needsMap && (obj.filters = obj.filters.map(convertToJSON))
    fs.writeFileSync(file, JSON.stringify(obj))
}

// ==========================================================

/**
 * Create a regular expression from a key
 * 
 * @param {String} key 
 */
function createRegex(key) {
    return new RegExp(`${key}`)
}

// ==========================================================

/**
 * Create a new object, given the `field` and its `keywords`
 * 
 * @see {@link https://github.com/Andrei0872/medium-bookmarks-to-trello/blob/master/config/index.js}
 * 
 * @param {String} name - The field name
 * @param {Array} key - The keywords for the field name
 */
function filter_info(name, key) {
    return {
        name,
        key: key.map(createRegex),
        items: new Set()
    }
}

// ==========================================================

/**
 * Create an object that will be added in the config object (bigObj)
 * It will be used to determine whether or not a list can be found in Trello
 * 
 * @example
 * trello['angular'] = location_info(angularListId, trelloBoardId)
 * 
 * @param {String} idList 
 * @param {String} id_board 
 */
function location_info(idList, id_board) {
    return {
        id_board,
        idList
    }
}

// ==========================================================

/**
 * Separate the `Medium id` from the whole link
 * Used when we want do remove a certain link from bookmarks(that's why we need the id)
 * 
 * @example
 * item = 'https://medium.freecodecamp.org/the-complete-guide-to-es10-features-5fd0feb9513a?source=bookmarks---------11---------------------'
 * returns
 * {
 *  id: '5fd0feb9513a',
 *  url: item
 * }
 * 
 * @param {Array} arr 
 */
function filterResults(arr) {
    return arr.map(item => {
        const arr = item.split('?')[0].split(/-([A-Za-z0-9]+)?/)
        const id = arr[arr.length - 2]

        return {
            id,
            url: item
        }
    });
}

// ==========================================================

/**
 * This filters the given links depending on bigObj.filters
 * 
 * @param {Array} arr - Array of { id: mediumId, url: mediumURl }
 * @param {Array} filters - The filters from bigObj.filters
 */
function results(arr, filters) {
    const unfiltered = new Set();
    let cnt = 0;

    let filtered = arr.reduce((memo, curr) => {
        let last_backslash = curr.url.lastIndexOf('/');
        let question_mark = curr.url.lastIndexOf('?')
        let str = curr.url.substring(last_backslash + 1, question_mark);
        str = str.split('-').slice(0, -1).join(' ')

        let ok = false;
        let ind;
        memo.forEach((item, i) => {
            if (!ok) {
                let found = item.key.some(k => k.test(str.toLowerCase()))
                if (found)
                    ok = true, ind = i
            }
        })
        if (ok && !memo[ind].items.has(curr))
            memo[ind].items.add(curr), cnt++;
        else unfiltered.add(curr)

        return memo;
    }, filters);

    return {
        filtered,
        unfiltered
    }
}

// ==========================================================

/**
 * Add card to trello
 * 
 * @param {Object} trello_info - @see location_info()
 * @param {String} link - the name of card(which will essentially be a link)
 * 
 * @returns {Function} - The actual Promise will be executed in @see processRequests()
 */
function addCard(trello_info, link) {
    return function () {
        return new Promise(async (resolve, reject) => {
            try {
                const resp = await fetch('https://trello.com/1/cards', {
                    headers: trello_headers,
                    method: "POST",
                    body: JSON.stringify({
                        ...req_options,
                        ...trello_info,
                        name: link
                    })
                });
                if (!resp.ok) {
                    throw resp
                }

                resolve((await (resp.json())))
            } catch (err) {
                reject((await err.text()))
            }
        })
    }
}

// ==========================================================

/**
 * Delete bookmark from Medium
 * 
 * @param {String} id 
 * 
 * @returns {Function} - The actual Promise will be executed in @see processRequests()
 */
function deleteBookmark(id) {
    return function () {
        return new Promise(async (resolve, reject) => {
            try {
                const resp = await fetch(`https://medium.com/p/${id}/bookmarks`, {
                    headers: medium_headers, // Cookies and CSRF token
                    method: "DELETE",
                })

                if (!resp.ok)
                    throw resp

                resolve((await resp.text()))
            } catch (err) {
                reject((await err.text()))
            }
        });
    }
}


// ==========================================================

/**
 * Print to the console the links that are in a list which can't be found in Trello
 * 
 * @param {Set} set 
 */
function beautifySetOutput (set) {
    let result = ``;
    [...set.values()].forEach(({ url }) => result += `${url}\n`);

    return result;
}

// ==========================================================

/**
 * Put each link into its corresponding list
 * Here you can also create lists on the fly.
 * 
 * @param {Array} arr - Filtered links 
 * @param {Object} bigObj - The object from `config.json`
 * @param {Object} storeTemp - The object that contains the links that will be added to a specific list without being filtered
 *                           - @see {@link https://github.com/Andrei0872/medium-bookmarks-to-trello/pull/2}
 */
async function save(arr, bigObj, storeTemp) {
    const { trello } = bigObj; 
    let needsUpdate = false;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // console.log(arr)
    // return;
    const listsAndTheirCards = arr.reduce((memo, curr) => {
        if (curr.items.size) {
            const existingItems = memo[curr.name] || new Set();
            [... curr.items.values()].forEach(existingItems.add.bind(existingItems));
            
            memo[curr.name] = existingItems;
        } 
        return memo
    }, { ...storeTemp })

    const allRequests = []
    for (let prop of Object.keys(listsAndTheirCards)) {
        if (!trello[prop]) {
            needsUpdate = true;

            console.log(`the list ${prop} is missing in Trello. This list consists of:\n ${beautifySetOutput(listsAndTheirCards[prop])}\n`)
            log('');

            // Wait for the user to accept/decline
            await new Promise((resolve, reject) => {
                rl.question(`do you want to create the '${prop}' list now ? (y/n)`, async data => {
                    const answer = data.toString().toLowerCase().trim()

                    if (answer === 'y') {
                        await addFilterKey([`create!${prop}`, []], bigObj, true);
                        resolve();
                    } else {
                        console.log('you must create the list before proceeding!')
                        process.exit(1);
                    }
                })
            });
        }

        // If the prop did not existed, this will execute after the user has accepted to create the list
        log(`\t ${prop.toUpperCase()}\n`);
        [...listsAndTheirCards[prop].values()].flatMap(data => {
            log(`Adding ${data.url} to ${prop} - ${new Date().toLocaleDateString()} \n`);
            allRequests.push([
                addCard(trello[prop], data.url),
                deleteBookmark(data.id)
            ]);
        })
    }

    // Update after some changes have been made(adding keywords | creating new lists)
    needsUpdate && updateJSON(bigObj, './config.json');

    rl.question('All good? (y/n)', text => {
        const resp = text.toString().trim()

        if (resp === 'y' || resp === 'Y') {
            console.log('processing the requests...')
            processRequests(allRequests)
        } else {
            console.log('Ok, make your changes. I\'ll wait here!')
        }

        rl.close();
    })

}

// ==========================================================

/**
 * For each of the given links, this function will perform 2 requests
 *  - Adding the link(card) to a certain list in Trello
 *  - Removing this link from Medium's Bookmarks
 * The function will also make sure that if one request fails, it will not proceed further.
 * 
 * @param {Array} requests - Each elements consists of a pair of 2 requests: 1 for Trello; 1 for Medium
 */
async function processRequests(requests) {
    let errorFound = false;

    try {
        await Promise.all(
            requests.flatMap(async ([addCard, deleteMediumBookmark]) => {
                return [
                    await addCard(),
                    await deleteMediumBookmark()
                ]
            })
        )
    } catch {
        console.log('An error has occurred! Please make sure that your cookies / tokens are up to date');
        errorFound = true;
    } finally {
        errorFound ? null : console.log('Links added successfully');
        clearFileContent(path.resolve(__dirname, '..', 'temp.json'));
    }
}

// ==========================================================

/**
 * Add keyword/keywords to a specific fields
 * Or you create a list
 * 
 * @param {Array} param0 
 * @param {Object} bigObj 
 * @param {Boolean} onlyCreateList 
 */
async function addFilterKey([nameToFind, newKey], bigObj, onlyCreateList = false, [filtered_again, url]) {
    const { trello } = bigObj;

    let index_field = -1,
        newField;
    
    const mustCreateIndex = nameToFind.indexOf('!');

    // Find the index of an existing list or set the name for the one that will be created
    mustCreateIndex === -1 &&
        (index_field = bigObj.filters
            .findIndex(({
                name
            }) => name === nameToFind))
        || (newField = nameToFind.slice(mustCreateIndex + 1)) 
        
    /**
     * Convention: list name = field
     * 
     * If the intention was not to create a new list and the list name that the user 
     * chose to add keywords to can't be found
     */
    if (index_field === -1 && mustCreateIndex === -1) {
        console.log(`${nameToFind} cannot be found.`)
        const suggestions = bigObj.filters.filter(({ name }) => {
            return name.includes(nameToFind) 
                || nameToFind.includes(name)
                || nameToFind.includes('_') 
                    &&  nameToFind.split('_').some(item => name.includes(item))
        })
        .map(filter => filter.name)

        suggestions.length && console.log(`Maybe you meant: ${suggestions}`)
        process.exit(1)
    }

    // If the `create!field <field_key>` command has been executed
    if (index_field === -1) {
        onlyCreateList === false
            && bigObj.filters.push({
                name: newField,
                key: newKey,
                items: new Set()
            });

        // Add list to Trello obj as well
        const { id, name, idBoard } = await addList(newField);
        console.log(`list ${newField} added to Trello`)
        trello[name] = location_info(id, idBoard);
        // filtered_again.push({ name: newField, key: newKey, items: new Set() });
        filtered_again[filtered_again.length -1].items.add(url);
        console.log(filtered_again.slice(-4))

    } else {
        bigObj.filters[index_field].key.push(...newKey);
        // filtered_again[index_field].key.push(...newKey);
    }
}

// ==========================================================

/**
 * Convert an object and all its nested properties to JSON
 * so it can be added to a JSON file
 * 
 * @param {Object} obj 
 */
function convertToJSON(obj) {
    const newKeyArr = JSON.stringify(obj.key.map(k => k.toString()))
    
    return {
        ...obj,
        key: newKeyArr,
    }
}

// ==========================================================

/**
 * Show the list names that can be found in your Trello
 * 
 * @param {Array} list 
 */
function showList (list) {
    list.map(({ name }) => name).sort().forEach(log)
}

// ==========================================================

/**
 * The response we get after making a request to get the bookmarks consists of
 * a big block of uglified html.
 * It is our duty to use the power of regular expressions to get the link from all that text block.
 */
async function getUnfilteredLinks() {

    let res = await (await fetch('https://medium.com/me/list/bookmarks', {
        headers: medium_headers
    })).text()

    res = res.split('<div class="loadingBar"></div>')[0];
    const newLink = /https:\/\/\S+\/[a-z-0-9\?=]+-+\d+-+/g;
    const unfilteredLinks = [...new Set(res.match(newLink))]

    if (!unfilteredLinks.length) {
        log("Hmm... there are no bookmarks!!")
        process.exit(0);
    }

    return unfilteredLinks;
}

// ==========================================================

function readFile(file) {
    return new Promise ((resolve, reject) => {
        fs.access(file, (err, _) => {
            if (err) reject();
            resolve();
        });
    })
}

// ==========================================================

/**
 * Check if an object is empty
 * 
 * @param {Object} obj 
 */
function isEmptyObject (obj) {
    return JSON.stringify(obj) === JSON.stringify({});
}

// ==========================================================

/**
 * Clear the content of a file
 * Particularly used with `temp.json`, which stores the links that will be added to a list
 * without being filtered.
 * So, after they are added, we want to clear the file.
 * 
 * @param {String} file 
 */
function clearFileContent (file) {
    fs.writeFile(file, '', (err, _) => {});
} 

module.exports = {
    parseJSON,
    createRegex,
    filter_info,
    location_info,
    filterResults,
    results,
    addCard,
    deleteBookmark,
    save,
    addFilterKey,
    convertToJSON,
    getUnfilteredLinks,
    updateJSON,
    showList,
    readFile,
    isEmptyObject,
}