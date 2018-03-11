module.exports = function (context, req) {
    const octokit = require("@octokit/rest")();
    context.log("JavaScript HTTP trigger function processed a request.");
    try {
        context.log("Connecting to GitHub...");
        const uname = req.query.name;
        octokit.repos.getForUser({
            username: uname
            , type: "all"
            , sort: "pushed"
            , direction: "desc"
            , page: 1
            , per_page: 100
        }).then(result => {
            const data = result.data;
            let g = data.map(x => {
                return { id: x.id, name: x.name, isFork: x.fork }
            });
            let p = [];
            for(let i = 0; i < g.length; i++) {
                p.push(new Promise(resolve => {
                    octokit.repos.getStatsCommitActivity({ 
                        owner: uname
                        , repo:g[i].name
                    }).then(pResult => {
                        context.log(pResult);
                        resolve(pResult);
                    });
                }));
            }
            Promise.all(p).then(data => {
                context.log(data);
            }).catch(err => {
                context.log(`Any error occurred while getting the repository list: ${e}`)
            });
            context.res = {
                 status: 200
                 , body: "Processed..." //Build response JSON
            };
        }).catch(err => {
            context.res = {
                status: 500
                , body: `Any error occurred while getting the repository information: ${err}`
            };
        });
    }
    catch(e) {
        context.res = {
            status: 500
            , body: `Any error has occurred while processing your request: ${e}`
        };
    }
    context.done();
};
