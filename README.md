Deploy-txp
==========

This is a package to make packaging, deploying, and signing testpilot
experiments easier.

It follows the guidelines specified in
https://github.com/clouserw/testpilot/blob/7a56f76b4aa2f974c7ea60bfa43ab0a5f9c194db/docs/development/hosting.md

`deploy-txp` assumes you will have an npm script `package` which will
run any linting, tests, and package up your addon, leaving it in the
root of your project named `addon.xpi`.

`deploy-txp` expects two environment variables, `TESTPILOT_AMO_USER`,
and `TESTPILOT_AMO_SECRET`.

## LICENSE
[Mozilla Public License 2.0](LICENSE)

