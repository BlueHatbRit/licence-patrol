const rp = require("request-promise");
const semver = require("semver");

async function check(pckJsonPath, pkgJsonUrl, config) {
  const whitelist = config.whitelist.map(x => x.toLowerCase());
  const blacklist = config.blacklist.map(x => x.toLowerCase());

  const req = {
    uri: pkgJsonUrl,
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "licence-patrol"
    }
  };

  let res = await rp(req);
  res = JSON.parse(res);

  const pkgJsonPath = res.path;
  const fileData = JSON.parse(
    Buffer.from(res.content, "base64").toString("utf8")
  );

  let alerts = [];
  for (const key in fileData.dependencies) {
    const versionOrLink = fileData.dependencies[key];
    console.log(versionOrLink);
    if (!semver.validRange(versionOrLink)) {
      // Todo: support non-npm packages
      continue;
    }

    const licence = await getLicence(key);
    licence = licence.toLowerCase();

    if (whitelist) {
      if (whitelist.indexOf(licence) === -1) {
        // If we have a whitelist and the licence is not on the whitelist, alert.
        alerts.push({ package: key, licence });
      }
    } else {
      // If we have a blacklist and the licence is on the blacklist, alert.
      if (blacklist.indexOf(licence) > -1) {
        alerts.push({ package: key, licence });
      }
    }
  }

  return { path: pckJsonPath, checks: alerts };
}

async function getLicence(module, versionOrLink) {
  const pkg = await getModulePackageJson(module);

  // Check to see if the licence is defined in the package.json
  const licence = pkg.license || pkg.licence;

  return licence || "unknown";
}

async function getModulePackageJson(module) {
  const req = { uri: "https://registry.npmjs.com/" + module, json: true };

  const res = await rp(req);

  const latestVersion = res["dist-tags"].latest;
  return res.versions[latestVersion];
}

module.exports = {
  check
};
