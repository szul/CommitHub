module.exports = function (context, req) {
    const octokit = require("@octokit/rest")();
    context.log("JavaScript HTTP trigger function processed a request.");
    try {
        context.log("Connecting to GitHub...");
        
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: "Hello " + (req.query.name || req.body.name)
        };
    }
    catch(e) {
        context.res = {
            status: 500,
            body: `Any error has occurred while processing your request: ${e}`
        };
    }
    context.done();
};
