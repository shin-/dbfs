var redis = require('redis');
var urlParser = require('url');

var Stats = require('../stats');

function RedisDriver(redisUrl, options) {
    if (!(this instanceof RedisDriver)) {
        return new RedisDriver(redisUrl, options);
    }

    this.readyListeners = [];
    this._isready = false;

    if (!redisUrl) {
        redisUrl = require('everypaas').getRedisUrl();
    }

    var parsedUrl = urlParser.parse(redisUrl);
    this.connectionInfo = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        password: parsedUrl.auth ? parsedUrl.auth.split(':')[1] : null
    };

    this.redisCli = redis.createClient(this.connectionInfo.port, this.connectionInfo.hostname);

    var ready = (function(err) {
        this._isready = true;
        this.readyListeners.forEach(function(cb) {
            cb(err, this);
        }, this);
    }).bind(this);

    var init = (function(cb) {
        this.redisCli.hget('/dbfs', '_type', (function(err, type) {
            if (err) return cb(err);
            if (type == 'directory') {
                return cb(null);
            } else if (type != null) {
                return cb('/dbfs is not a directory');
            } else {
                this.redisCli.hmset('/dbfs', Stats(0, 0, 'directory'), function(err) {
                    return cb(err);
                });
            }
        }).bind(this));
    }).bind(this);

    if (this.connectionInfo.password)
        this.redisCli.auth(this.connectionInfo.password, function(err) {
                if (err) return ready(err);
                init(function(err) {
                    ready(err);
                });
        });
    else
        init(function(err) {
            ready(err);
        });
}


// pathToKey(path)
// Transforms given path to a valid key (prefixed with /dbfs, no multiple slashes...)
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
    }, '');
}

// dirForFile(path)
// Strips the last part of the path to obtain the containing directory.
function dirForFile(path) {
    dirs = path.split('/');
    dirs.pop();
    return dirs.join('/');
}

// getNodeIndex(redisCli, callback)
// Gets the next inode (node index) from Redis and calls back (err, inode)
function getNodeIndex(redisCli, cb) {
    redisCli.incr('///inode', cb);
}

// RedisDriver#ready(callback)
// Adds a callback to the list of functions to call once RedisDriver is ready to operate.
RedisDriver.prototype.ready = function(callback) {
    if (this._isready) {
        return callback(this.error, this);
    }
    this.readyListeners.push(callback);
}

// RedisDriver#rename
// http://nodejs.org/api/fs.html#fs_fs_rename_oldpath_newpath_callback
RedisDriver.prototype.rename = function(oldPath, newPath, callback) {
    oldPath = pathToKey(oldPath);
    newPath = pathToKey(newPath);
    var redisCli = this.redisCli;

    redisCli.hget(dirForFile(newPath), '_type', function(err, type) {
        if (err) {
            return callback && callback(err);
        }

        if (type != 'directory') {
            return callback && callback(newPath + ' is not a valid target');
        }

        redisCli.hget(newPath, 'ino', function(err, ino) {
            if (err) {
                return callback && callback(err);
            }

            redisCli.rename(oldPath, newPath, function(err) {
                if (err) {
                    return callback && callback('Source ' + oldPath + ' does not exist');
                }
                // Remove old file data if it exists (asynchronously, ignoring result).
                if (ino) {
                    redisCli.del('///file' + ino);
                }
                return callback && callback(null);
            });
        });

    });
}

RedisDriver.prototype._writeNewFile = function(filename, data, encoding, callback) {
    var redisCli = this.redisCli;
    // Check if directory exists
    redisCli.hget(dirForFile(filename), '_type', function(err, type) {
        // Doesn't exist / not a directory
        if (type != 'directory') {
            return callback && callback(dirForFile(filename) + ' is not a directory');
        }
        // Get inode number to create stats object and know where to store the file
        getNodeIndex(redisCli, function(err, inode) {
            if (err)
                return callback && callback(err);
            // Setting the stats object and the data can be done simultaneously.
            redisCli.multi()
                .hmset(filename, Stats(inode, data.length, 'file'))
                .set('///file' + inode, data)
                .exec(function(err, replies) {
                    return callback && callback(err);
                });
        });
    });
}

// RedisDriver#writeFile
// http://nodejs.org/api/fs.html#fs_fs_writefile_filename_data_encoding_callback
RedisDriver.prototype.writeFile = function(filename, data, encoding, callback) {
    filename = pathToKey(filename);
    var redisCli = this.redisCli;

    if (typeof encoding == 'function') {
        callback = encoding;
        encoding = 'utf-8';
    }

    redisCli.hmget(filename, '_type', 'ino', (function(err, info) {
        var type = info[0], ino = info[1];
        if (err) {
            return callback && calback(err);
        } else if (type == 'file') {
            // Overwrite pre-existing file.
            redisCli.multi()
                .hset(filename, 'size', data.length.toString())
                .set('///file' + ino, data)
                .exec(function(err, replies) {
                    return callback && callback(err);
                });

        } else if (type == 'directory') {
            return callback && callback('Can not overwrite directory ' + filename);
        } else {
            this._writeNewFile(filename, data, encoding, callback);
        }
    }).bind(this));
}

module.exports = RedisDriver;