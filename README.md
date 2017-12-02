# Licence Patrol

The Licence Patrol watch your repositories Pull Requests and checks the licences
of new packages added.

Note: this is a conveniance tool and should be considered a helper, do not rely
entirely on this to keep your codebase legally in order.

## Installation

To install this on your repository, go to
[https://github.com/apps/licence-patrol](https://github.com/apps/licence-patrol).
It can be installed on an individual repository, or across all your repos for an
organisation.

## Configuration

You can configure Licence Patrol for each repository individually, simply add a
file called `licence-patrol.yaml` inside a `.github` directory. This `.github`
directory should sit on the root of your repository.

The configuration file may define two yaml arrays, a `whitelist` and
`blacklist`. Inside these you can add the name of a licence (in any case).

Licence Patrol will also alert you of any modules where a licence cannot be
found.

### Defaults

```yaml
blacklist:
    - GPLv3
    - GPL-3.0
    - GPL 3
    - unlicenced
    - unlicensed
```

## Supported package managers

* NPM (npm registry hosted modules only)

If you don't see your favourite package manager on this list, send us a pull
request!

## Required permissions

Licence patrol asked for permission to three things, because your code is
precious we want to take a moment explain why each is needed.

* Repository meta data - This is required so we can interact with your
  repository on a basic level. All github apps current ask for this permission
  by default.
* Read your code - People like to place their package manager declaration files
  all around the shop, as a result we need to ask for access to all your code as
  we can't predict the specific file location. All of our code is open source so
  you can see what we read, if you still don't trust us then you can also always
  self host.
