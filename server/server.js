const { init, getStatus } = require("./config/app.config");
init().then(() => {
    console.log(getStatus())
}).catch((error) => {
    console.error("Error initializing app:", error);
});
