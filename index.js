const npmChecker = require("./lib/npm");

const defaultConfig = {
  blackList: ["none", "unlicenced", "gpl"]
};

module.exports = robot => {
  robot.log("Application started");

  robot.on("pull_request", async context => {
    const pr = {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      number: context.payload.number
    };

    const config = await context.config("licence-patrol.yaml", defaultConfig);

    // "unknown" is emitted if we can't find a licence, we'll **always** report
    // if we don't know the licence as it's the safest thing to do for the users.
    config.blackList.push("unknown");

    let alerts = [];
    const files = await context.github.pullRequests.getFiles(pr);
    for (const file of files.data) {
      if (file.filename === "package.json") {
        console.log("Checking licences for", file.filename);

        const results = await npmChecker.check(
          file.filename,
          file.contents_url,
          config.blackList
        );
        if (results.checks.length > 0) {
          alerts.push(results);
        }
      }
    }

    if (alerts.length > 0) {
      for (const pkgMngAlerts of alerts) {
        console.log("Commenting licence alerts for:", pkgMngAlerts.path);

        pr.body = createAlertMessage(pkgMngAlerts.checks);
        pr.commit_id = context.payload.pull_request.head.sha;
        pr.path = pkgMngAlerts.path;
        pr.position = 1;

        await context.github.pullRequests.createComment(pr);
      }
    } else {
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
    msg += `${alrt.package} - ${alrt.licence}`;
  });

  return msg;
}
