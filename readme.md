
<!-- ### There is also an article about this.  -->

<!-- https://gist.github.com/joyrexus/16041f2426450e73f5df9391f7f7ae5f -->

<!-- urlTrello: ...?lists=open -->

## Getting started

* ```cp .env.example .env```

* ```npm i```
* [Setting up Trello](#setting-up-trello)

* [Setting up Medium](#setting-up-medium)


## Features
<!-- log file -->
<!-- add new filter key -->
<!-- add new filter and filter key -->
<!-- add item to trello -->

---

## Setting up Trello

<!-- Getting idBoard -->
<!-- Create trello board -->
<!-- Network tab + refresh -->
<!-- Get id -->

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
<!-- Getting trello token && cookie -->
<!-- Clear Network tab -->
<!-- Create new dummy list -->
<!-- Click on the request -->
<!-- Headers -> req payload -> token -->
<!-- Getting the cookie -->
<!-- Headers -> cookie -->
<!-- Getting the urlTrello -->
<!-- Copy the current URL -->

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

## TODOS

* [ ] add filter url to a certain category without any filter key
* [ ] keep article in saved bookmarks (thus will not be added to trello)