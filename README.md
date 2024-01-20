# Maplecroft Frontend Development Test

## Quick Start

```
npm install
npm start
```

## Tasks

This is a simple Angular application to display a globe with countries colour coded to illustrate the level of risk for each country measured against a client's portfolio.

You can rotate and zoom in and out on the globe, hovering over a country will show the country name and risk score at the top right of the window.

You've been asked to make some improvements to this application, listed below are your tasks.

* Some countries do not have scores shown for some reason even though the API response includes those scores. In particular the client needs France and Norway to work, you need to make a change so that the scores/colour coding for those countries work.

* Currently the API call is done from AppComponent, we would like this to be in a separate service.

* The data includes an entitled boolean, we would like all countries where entitled is false to not have scores/colours displayed on the globe.

* Implement tests for your new data service and ensure existing tests work. (This application uses Jasmine/Karma, however feel free to convert it to Jest if you wish)

* To help your Team Lead plan for future development of this application provide a brief list of issues and/or improvements that could be made to this application.

## Submission of Completed Test

**Please do not fork this repository directly**, instead download/clone it, make your changes and upload to a new separate repository (e.g. GitHub, BitBucket etc.) or create a zip file from your local repo.