//@ts-check

module.exports = function (context, req) {
    require("dotenv-extended").load();
    const octokit = require("@octokit/rest");
    const octo = new octokit();
    context.log("JavaScript HTTP trigger function processed a request.");
    try {
        context.log("Connecting to GitHub...");
        const uname = req.query.name;
        octo.repos.getForUser({
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
                let repo = g[i];
                p.push(new Promise(resolve => {
                    octo.repos.getStatsParticipation({ 
                        owner: uname
                        , repo:repo.name
                    }).then(pResult => {
                        let o = pResult.data.owner;
                        let pSum = Object.keys(o).reduce((a, k) => {
                            return a + o[k];
                        });
                        repo.commits = pSum;
                        resolve(repo);
                    });
                }));
                p.push(new Promise(resolve => {
                    octo.repos.getStatsCodeFrequency({
                        owner: uname
                        , repo:repo.name
                    }).then(fResult => {
                        let f = fResult.data;
                        context.log(f);
                        resolve(f);
                    });
                }));
            }
            Promise.all(p).then(data => {
                context.log(data);
                context.res = {
                    status: 200
                    , body: "Processed..." //Build response JSON
               };
               context.done();
            }).catch(err => {
                context.log(`Any error occurred while getting the repository list: ${err}`)
            });
        }).catch(err => {
            context.res = {
                status: 500
                , body: `Any error occurred while getting the repository information: ${err}`
            };
            context.done();
        });
    }
    catch(e) {
        context.res = {
            status: 500
            , body: `Any error has occurred while processing your request: ${e}`
        };
        context.done();
    }
};
