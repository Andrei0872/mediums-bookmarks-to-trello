
<!-- ### There is also an article about this.  -->

# Moving your Medium Bookmarks to Trello
I firmly believe that our time should be spent on important things. <br>
*The time you spent searching for an article could be time spent on reading that article.*

## Demo
Insert gif here

---

## Getting started

* ```cp .env.example .env```

* ```npm i```

* [Setting up Trello](#setting-up-trello)

* [Setting up Medium](#setting-up-medium)

---

## Features

*conventions*: field = list name; keyword = filter key

* fetch saved posts from Medium and transfer them to Trello and also remove them from bookmark list
* the keywords for a field can also include regular expressions
* <details>
    <summary>add keyword to a field</summary>
    <div>
        Syntax: <code> $field_name $filter_key1 | $filter_key2</code>
        <br>
        Example: react react hooks | \bstyled components\b
    </div>
    </details> 
* <details>
    <summary>create field and add keywords to it</summary>
    <div>
        Syntax: <code> create!$field_name $filter_key1 | $filter_key2</code>
        <br>
        Example: create!posts development posts
    </div>
    </details> 
* You can see where each card will be placed by having a look at **info.log** file after getting the message **All good? (y/n)**
* the `show_list` command will print the existing lists name into the **info.log** file
* create a Trello list if the list name exists in **config.json**, but not in Trello
* add link to a list(doesn't necessarily have to exist) without applying any filters. [Read more](https://github.com/Andrei0872/medium-bookmarks-to-trello/pull/2)

---

## Setting up Trello

<details>
    <summary>
        Getting the idBoard & token & cookie
    </summary>
    <ul>
        <li>Create a new card</li>
        <li>Open the dev tools and open the Network tab</li>
        <li>Clear the Network tab.</li>
        <li>Create a new list(doesn't matter the name)</li>
        <li>Click on the <i>lists</i> request</li>
        <li>Click on the <i>Headers</i> tab</li>
        <li>Head over to <i>Request Payload</i></li>
        <li>Select the <i>idBoard</i> and paste it in the <i>.env</i> file</li>
        <li>Select the <i>token</i> and paste it in the <i>.env</i> file next to <i>tokenTrello</i></li>
        <li>Select the <i>cookie</i>(located in the Request Headers) and paste it in the <i>.env</i> file next to <i>cookieTrello</i></li>
    </ul>
</details>

<details>
    <summary>
        Getting the trello-specific url (needed when adding a new list to a board)
    </summary>
    <ul>
        <li>Copy the short link from the url (https://trello.com/b/COPY_THIS_ONE/board_name)</li>
        <li>Head over the <i>urlTrello</i> property</li>
        <li>in the <i>.env</i> file replace the <i>YOUR_BOARD_ID</i> with the short link</li>
        <li>You may now delete the list you have created earlier</li>
    </ul>
</details>

---

## Setting up Medium

Getting the cookie & token
* Go to your bookmarks
* Open the dev tools and go to the Network tab
* Refresh the page and scroll down until a new request is made (bookmarks?limit=20...)
* Select the <i>Headers</i> tab
* Copy the <i>cookie</i> located in the Request Headers and paste it in the <i>.env</i> file
* Coy the <i>x-xsrf-token</i> located in the Request Headers and paste it in the <i>.env</i> file

<!-- cookie and token -->
<!-- Go to bookmarks -->
<!-- Ofc, you need to have some bookmarks -->
<!-- Network tab + Refresh -->
<!-- Scroll until bookmarks req is made -->
<!-- Click the request -->
<!-- Req headers -> cookie -->
<!-- Req headers -> token -->


## Examples
<!-- SS with medium bookmarks -->
<!-- cli when running the main commnad -->
<!-- trello afterwards -->
<!-- all or nothing -->
