//@ts-check

module.exports = async function (context, req) {
    require("dotenv-extended").load();
    const octokit = require("@octokit/rest");
    const octo = new octokit();
    context.log("JavaScript HTTP trigger function processed a request.");
    try {
        context.log("Connecting to GitHub...");
        const uname = req.query.name;

        octo.authenticate({
            type: "token"
            , token: process.env.TOKEN
        });

        let result = await octo.repos.getForUser({
            username: uname
            , type: "all"
            , sort: "pushed"
            , direction: "desc"
            , page: 1
            , per_page: 100
        });

        const data = result.data;
        let g = data.map(x => {
            return { id: x.id, name: x.name, isFork: x.fork, url: x.html_url }
        });
        let p = [];
        for(let i = 0; i < g.length; i++) {
            let repo = g[i];
            let pResult = await octo.repos.getStatsParticipation({ 
                owner: uname
                , repo:repo.name
            });
            let o = pResult.data.owner;
            let pSum = "0";
            try {
                pSum = Object.keys(o).reduce((a, k) => {
                    if(o.hasOwnProperty(k)) {
                        try {
                            return (parseInt(a, 10) + parseInt(o[k], 10)).toString();
                        }
                        catch(e) {
                            return (0).toString();
                        }
                    }
                });
            }
            catch(e) { }
            repo.commits = pSum;

            /*
             * Can't use code frequency for individual users.
             * Need to get contributor list of repo. Then extract data.
             * 
            let fResult = await octo.repos.getStatsCodeFrequency({
                owner: uname
                , repo:repo.name
            });
            let f = fResult.data;
            if(Array.isArray(f)) {
                f.reverse();
            }
            let additions = 0;
            let subtractions = 0;
            for(let ii = 0; ii < f.length; ii++) {
                try {
                    additions += parseInt(f[ii][1]);
                    subtractions += parseInt(f[ii][2]);
                }
                catch(ei) {
                    context.log(`Error in stats: ${ei}`);
                }
                if(ii == 51) {
                    break;
                }
            }
            repo.additions = additions;
            repo.subtractions = subtractions;
            */
        }

        const commits = g.filter(function(itm, pos) {
            return g.indexOf(itm) == pos;
        })
        context.res = {
            status: 200
            , headers: {
                "Access-Control-Allow-Credentials" : "true",
                "Access-Control-Allow-Origin" : "*",
                "Access-Control-Allow-Methods" : "GET",
                "Access-Control-Allow-Headers" : "Content-Type, Cache-Control",
                "Access-Control-Max-Age" : "86400",
                "Vary" : "Accept-Encoding, Origin",
                "Content-Type" : "application/json"
            }
            , body: { commits }
        };
    }
    catch(e) {
        context.res = {
            status: 500
            , body: `Any error has occurred while processing your request: ${e}`
        };
    }
};
