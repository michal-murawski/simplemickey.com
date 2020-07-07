---
title: Cypress pros and cons
date: 2020-07-07T15:31:07.400Z
tags: cypress,e2e
---
## Pros

1. It is easy to debug what went wrong (simple ability to time travel) and useful error messages.
2. Ability to start a test very fast and run them locally.
3. Automatic file change detection allows us to develop and have a running single test in the background.
4. Easy and fun to develop by simple front-end developers.
5. Tests repetition is much better in comparison to *Selenium/Webdriver* (in our case, once the test was written and there was no change in the corresponding piece of code it was always green. We did not get any false results without a reason).

## Cons

1. Using `Cypress` `command` method which extends `cy` object prototype. Migh looks friendly in the begining but in a long term can be harder to maintain ([article](https://www.cypress.io/blog/2019/01/03/stop-using-page-objects-and-start-using-app-actions/)).
2. Custom **async/await** implementation. We need to adjust to a specific way of handling *async* actions/commands ([article](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html#Commands-Are-Asynchronous)).
3. You could say it is not 100% user behavior as Cypress is using JavaScript to execute its commands. Actions like clicking browser Prompt/Confirm window can be hard ([gh issue](https://github.com/cypress-io/cypress/issues/376)).
4. Still, quite a lot opened issues: [gh issues](https://github.com/cypress-io/cypress/issues)