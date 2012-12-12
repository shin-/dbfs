function DbFS(driver, connectionString, options, callback) {
    if (!(this instanceof DbFS))
        return new DbFS(driver, connectionString, options, callback);

    this.driverName = driver;
    if (typeof connectionString == 'function') {
        callback = connectionString;
        connectionString = null;
        options = null;
    } else if (typeof options == 'function') {
        callback = options;
        options = null;
    } else if (typeof connectionString == 'object' && typeof options == 'function') {
        callback = options;
        options = connectionString;
        connectionString = null;
    }

    try {
        this.driverClass = require('./drivers/' + this.driverName);
    } catch (e) {
        if (options.debug)
            throw e;
        var drivers = require('fs').readdirSync(__dirname + '/drivers');
        drivers = drivers.map(function(item) {
            return item.substring(0, item.indexOf('.js'));
        });
        this.initError = 'Driver "' + this.driverName + '" does not exist.\
        Acceptable values include: ' + drivers.join(', ');
        return callback(this.initError, null);
    }
    this.driver = this.driverClass(connectionString, options);
    this.driver.ready((function(err) {
        return callback(err, this);
    }).bind(this));
}

DbFS.prototype.notImplemented = function() {
    return 'Not Implemented (driver:' + this.driverName + ')';
}

DbFS.prototype.rename = function(oldPath, newPath, callback) {
    this.driver.rename ? this.driver.rename(oldPath, newPath, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.truncate = function(fd, len, callback) {
    this.driver.truncate ? this.driver.truncate(fd, len, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.chown = function(path, uid, gid, callback) {
    this.driver.chown ? this.driver.chown(path, uid, gid, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.fchown = function(fd, uid, gid, callback) {
    this.driver.fchown ? this.driver.fchown(fd, uid, gid, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.lchown = function(path, uid, gid, callback) {
    this.driver.lchown ? this.driver.lchown(path, uid, gid, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.chmod = function(path, mode, callback) {
    this.driver.chmod ? this.driver.chmod(path, mode, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.fchmod = function(fd, mode, callback) {
    this.driver.fchmod ? this.driver.fchmod(fd, mode, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.lchmod = function(path, mode, callback) {
    this.driver.lchmod ? this.driver.lchmod(path, mode, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.stat = function(path, callback) {
    this.driver.stat ? this.driver.stat(path, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.link = function(srcpath, dstpath, callback) {
    this.driver.link ? this.driver.link(srcpath, dstpath, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.symlink = function(srcpath, dstpath, type, callback) {
    this.driver.symlink ? this.driver.symlink(srcpath, dstpath, type, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.readlink = function(path, callback) {
    this.driver.readlink ? this.driver.readlink(path, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.realpath = function(path, cache, callback) {
    this.driver.realpath ? this.driver.readlink(path, callback) :
        callback(this.notImplemented());
};

DbFS.prototype.unlink = function(path, callback) {
    this.driver.unlink ? this.driver.unlink(path, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.rmdir = function(path, callback) {
    this.driver.rmdir ? this.driver.rmdir(path, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.mkdir = function(path, mode, callback) {
    this.driver.mkdir ? this.driver.mkdir(path, mode, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.readdir = function(path, callback) {
    this.driver.readdir ? this.driver.readdir(path, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.close = function(fd, callback) {
    this.driver.close ? this.driver.close(fd, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.open = function(path, flags, mode, callback) {
    this.driver.open ? this.driver.open(path, flags, mode, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.utimes = function(path, atime, mtime, callback) {
    this.driver.utimes ? this.driver.utimes(path, atime, mtime, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.futimes = function(fd, atime, mtime, callback) {
    this.driver.futimes ? this.driver.futimes(fd, atime, mtime, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.fsync = function(fd, callback) {
    this.driver.fsync ? this.driver.fsync(fd, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.write = function(fd, buffer, offset, length, position, callback) {
    this.driver.write ? this.driver.write(fd, buffer, offset, length, position, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.read = function(fd, bufer, offset, length, position, callback) {
    this.driver.read ? this.driver.read(fd, buffer, offset, length, position, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.readFile = function(filename, encoding, callback) {
    this.driver.readFile ? this.driver.readFile(filename, encoding, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.writeFile = function(filename, data, encoding, callback) {
    this.driver.writeFile ? this.driver.writeFile(filename, data, encoding, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.appendFile = function(filename, data, encoding, callback) {
    this.driver.appendFile ? this.driver.appendFile(filename, data, encoding, callback) :
        callback(this.notImplemented());
}

DbFS.prototype.watchFile = function(filename, options, listener) {
    this.driver.watchFile ? this.driver.watchFile(filename, options, listener) :
        callback(this.notImplemented());
}

DbFS.prototype.unwatchFile = function(filename, listener) {
    this.driver.unwatchFile ? this.driver.unwatchFile(filename, listener) :
        callback(this.notImplemented());
}

DbFS.prototype.watch = function(filename, options, listener) {
    if (this.driver.watch) {
        return this.driver.watch(filename, options, listener);
    }
    throw this.notImplemented();
}

DbFS.prototype.exists = function(path, callback) {
    if (this.driver.exists)
        return this.driver.exists(path, callback)
    throw this.notImplemented();
}

module.exports = DbFS;