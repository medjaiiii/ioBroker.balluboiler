![Logo](admin/balluboiler.png)
# ioBroker.balluboiler

[![NPM version](http://img.shields.io/npm/v/iobroker.balluboiler.svg)](https://www.npmjs.com/package/iobroker.balluboiler)
[![Downloads](https://img.shields.io/npm/dm/iobroker.balluboiler.svg)](https://www.npmjs.com/package/iobroker.balluboiler)
![Number of Installations (latest)](http://iobroker.live/badges/balluboiler-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/balluboiler-stable.svg)
[![Dependency Status](https://img.shields.io/david/medjaiiii/iobroker.balluboiler.svg)](https://david-dm.org/medjaiiii/iobroker.balluboiler)
[![Known Vulnerabilities](https://snyk.io/test/github/medjaiiii/ioBroker.balluboiler/badge.svg)](https://snyk.io/test/github/medjaiiii/ioBroker.balluboiler)

[![NPM](https://nodei.co/npm/iobroker.balluboiler.png?downloads=true)](https://nodei.co/npm/iobroker.balluboiler/)

## balluboiler adapter for ioBroker

Ballu boiler
Адаптер для водонагревателей Ballu серии SMART моделей BWH/S Smart WIFI.
Для работы с адаптером необходим самодельный ESP контролер(Wemos(у него есть 5в пин на борту или другой).
На ESP необходимо залить скетч через ардуино предварительно отредактировав и указав параметры wifi https://github.com/medjaiiii/ioBroker.balluboiler/blob/main/ESP/wifi_serial/wifi_serial.ino
К адаптеру припаивается USB разъем(на TX белый провод, на RX зеленый провод). 
Устанавливаем адаптер и в настройках прописываем IP адрес устройства.

Adapter for Ballu SMART series water heaters models BWH/S Smart WIFI.
To work with the adapter, you need a self-made ESP controller (Wemos(it has a 5V pin on board or another).
On the ESP you need to fill in the sketch via Arduino after editing and specifying the wifi parameters https://github.com/medjaiiii/ioBroker.balluboiler/blob/main/ESP/wifi_serial/wifi_serial.ino
The USB connector is soldered to the adapter(on the TX white wire, on the RX green wire).
Install the adapter and specify the IP address of the device in the settings.

## Developer manual
This section is intended for the developer. It can be deleted later

### Getting started

You are almost done, only a few steps left:
1. Create a new repository on GitHub with the name `ioBroker.balluboiler`
1. Initialize the current folder as a new git repository:  
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
1. Link your local repository with the one on GitHub:  
    ```bash
    git remote add origin https://github.com/medjaiiii/ioBroker.balluboiler
    ```

1. Push all files to the GitHub repo:  
    ```bash
    git push origin master
    ```
1. Head over to [main.js](main.js) and start programming!

### Best Practices
We've collected some [best practices](https://github.com/ioBroker/ioBroker.repositories#development-and-coding-best-practices) regarding ioBroker development and coding in general. If you're new to ioBroker or Node.js, you should
check them out. If you're already experienced, you should also take a look at them - you might learn something new :)

### Scripts in `package.json`
Several npm scripts are predefined for your convenience. You can run them using `npm run <scriptname>`
| Script name | Description                                              |
|-------------|----------------------------------------------------------|
| `test:js`   | Executes the tests you defined in `*.test.js` files.     |
| `test:package`    | Ensures your `package.json` and `io-package.json` are valid. |
| `test` | Performs a minimal test run on package files and your tests. |
| `lint` | Runs `ESLint` to check your code for formatting errors and potential bugs. |

### Writing tests
When done right, testing code is invaluable, because it gives you the 
confidence to change your code while knowing exactly if and when 
something breaks. A good read on the topic of test-driven development 
is https://hackernoon.com/introduction-to-test-driven-development-tdd-61a13bc92d92. 
Although writing tests before the code might seem strange at first, but it has very 
clear upsides.

The template provides you with basic tests for the adapter startup and package files.
It is recommended that you add your own tests into the mix.

### Publishing the adapter
Since you have chosen GitHub Actions as your CI service, you can 
enable automatic releases on npm whenever you push a new git tag that matches the form 
`v<major>.<minor>.<patch>`. The necessary steps are described in `.github/workflows/test-and-release.yml`.

To get your adapter released in ioBroker, please refer to the documentation 
of [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories#requirements-for-adapter-to-get-added-to-the-latest-repository).

### Test the adapter manually on a local ioBroker installation
In order to install the adapter locally without publishing, the following steps are recommended:
1. Create a tarball from your dev directory:  
    ```bash
    npm pack
    ```
1. Upload the resulting file to your ioBroker host
1. Install it locally (The paths are different on Windows):
    ```bash
    cd /opt/iobroker
    npm i /path/to/tarball.tgz
    ```

For later updates, the above procedure is not necessary. Just do the following:
1. Overwrite the changed files in the adapter directory (`/opt/iobroker/node_modules/iobroker.balluboiler`)
1. Execute `iobroker upload balluboiler` on the ioBroker host

## Changelog

### 0.0.1
* (medjai) initial release

## License
MIT License

Copyright (c) 2021 medjai <medjai@inbox.ru>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.