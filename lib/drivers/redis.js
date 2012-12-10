var redis = require('redis');
var urlParser = require('url');

var Stats = require('../stats');

function RedisDriver(redisUrl, options) {
    if (!(this instanceof RedisDriver)) {
        return new RedisDriver(redisUrl, options);
    }

    this.readyListeners = [];
    this.ready = false;

    if (!redisUrl) {
        redisUrl = require('everypaas').getRedisUrl()
    }

    var parsedUrl = urlParser.parse(redisUrl);
    this.connectionInfo = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        password: parsedUrl.auth.split(':')[1]
    };

    function ready(err) {
        this.ready = true;
        this.readyListeners.forEach(function(cb) {
            cb(err, this);
        }, this);
    }

    ready = ready.bind(this);

    this.redisCli = redis.createClient(this.connectionInfo.port, this.connectionInfo.hostname);
    this.redisCli.auth(this.connectionInfo.password, function(err) {
            ready(err);
    });
}

function pathToKey(path) {
    dirs = path.split('/');
    return dirs.reduce(function(path, item, n) {
        if (n == 0 && item !== '') {
            path += '/dbfs';
        }
        if (n == 1 && item !== 'dbfs') {
            path += '/dbfs';
        }

        if (item !== '') {
            return path + '/' + item;
        }
        return path;
    }, '')
}

function dirForFile(path) {
    dirs = path.split('/');
    dirs.pop();
    return dirs.join('/');
}

RedisDriver.prototype.ready = function(callback) {
    if (this.ready) {
        return callback(this.error, this);
    }
    this.readyListeners.push(callback);
}

RedisDriver.prototype.rename = function(oldPath, newPath, callback) {
    oldPath = pathToKey(oldPath);
    newPath = pathToKey(newPath);
    redisCli.hget(dirForFile(path), 'type', function(err, type) {
        if (type != 'directory') {
            return callback(newPath + ' is not a valid target');
        }
        redisCli.rename(oldPath, newPath, function(err) {
            if (err) {
                return callback('Source ' + newPath + ' does not exist');
            }
            // FIXME: Removed old file data if it exists.
            return callback(null);
        });
    });
}

RedisDriver.prototype.writeFile = function(filename, data, encoding, callback) {
    filename = pathToKey(filename);
    redisCli.hget(dirForFile(filename), 'type', function(err, type) {
        if (type != 'directory') {
            return callback(dirForFile(filename) + ' is not a directory');
        }
        redisCli.hmset(filename, Stats(inode, data.length, 'file'));
    })
}

module.exports = RedisDriver;