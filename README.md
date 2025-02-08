1. Please make sure redis is installed and working in the local and server
2. Please add firebase-service-account.json for notification (FCM)
3. For digital payment im using core api midtrans, so make sure your credential key is ready to integrating in this repo
4. Copy the .env.default to .env and fill the requirement
5. This queries using prisma orm, so make sure generate & push prisma model to database
6. Make sure remote database in your env is true and enabled
7. I'm not good enough to write the docc, im using remote db for the first step, then if u have some trouble when pusshing prisma db please be kind to solve by your self or create issue or dm me on thread / insta
8. if u want to create custom validation or anything that make this repository to be better please do it and leave pull request
9. this db implementing store,update,delete procedure & store,update,delete trigger (for replace db transaction and training memories for database management), so make sure adding pecedure & trigger before create transaction (I have prepared it in db_management_note.txt)
10. npm install (for install dependencies and libraries)
11. npx nodemon . (for running this project)
12. please leave star for this if this repository is legit
13. thanks, feel free to use this project
