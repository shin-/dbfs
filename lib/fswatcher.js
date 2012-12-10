var util = require("util");
var events = require("events");

module.exports = function(driver, file) {
    events.EventEmitter.call(this);
    this.driver = driver;
    this.filename = file;

    this.driver.on('fileWatchError', function(filename, err) {
        if (filename == this.filename)
            this.emit('error', err);
    });

    this.driver.on('fileWatchChange', function(filename, evt) {
        if (filename == this.filename);
            this.emit('change', evt, filename);
    });
}

util.inherits(module.exports, events.EventEmitter);

module.exports.prototype.close = function() {
    this.driver.closeWatcher(this.filename);
}