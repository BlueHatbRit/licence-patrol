const npmChecker = require("./lib/npm");

const defaultConfig = {
  blackList: ["GPLv3", "GPL-3.0", "GPL 3", "unlicenced", "unlicensed"]
};

module.exports = robot => {
  robot.log("Application started");

  robot.on("pull_request", async context => {
    robot.log(
      "PR recieved from: " +
        context.payload.repository +
        " id: " +
        context.payload.number +
        " action: " +
        context.payload.action
    );

    if (context.payload.action !== "opened") {
      robot.log('Action not "open", doing nothing');
      return;
    }

    const pr = {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      number: context.payload.number
    };

    const config = await context.config("licence-patrol.yaml", defaultConfig);
    config.blacklist = config.blacklist || [];
    config.whitelist = config.whitelist || [];

    // "unknown" is emitted if we can't find a licence, we'll **always** report
    // if we don't know the licence as it's the safest thing to do for the users.
    config.blacklist.push("unknown");
    robot.log(config.blacklist);

    // If they provide both a blacklist and whitelist, the whitelist wins and the
    // blacklist is ignored.
    if (config.whitelist && config.blacklist) {
      delete config.blacklist;
    }

    let alerts = [];
    let checksMade = false;
    const files = await context.github.pullRequests.getFiles(pr);
    for (const file of files.data) {
      if (file.filename === "package.json") {
        robot.log(`Checking package ${file.filename} packages`);

        const results = await npmChecker.check(
          file.filename,
          file.contents_url,
          config
        );
        if (results.checks.length > 0) {
          alerts.push(results);
        }

        checksMade = true;
      } else {
        robot.log("No package changes to check");
      }
    }

    if (checksMade && alerts.length > 0) {
      robot.log("Issuing licence alerts:", alerts.length);

      for (const pkgMngAlerts of alerts) {
        pr.body = createAlertMessage(pkgMngAlerts.checks);
        pr.commit_id = context.payload.pull_request.head.sha;
        pr.path = pkgMngAlerts.path;
        pr.position = 1;

        await context.github.pullRequests.createComment(pr);
      }
    } else if (checksMade && alerts.length === 0) {
      robot.log("No alerts to issue");

      const issue = context.issue({
        body: "Your new package licences are all in order!"
      });

      await context.github.issues.createComment(issue);
    }
  });
};

function createAlertMessage(alerts) {
  let msg =
    "The following packages have licences which are on your blacklist, " +
    "you should consider changing them:\n\n";

  alerts.forEach(alrt => {
    msg +=
      `* [${alrt.package}](https://www.npmjs.com/package/${alrt.package}) ` +
      `- ${alrt.licence.toUpperCase()}`;
  });

  return msg;
}
