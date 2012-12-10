function Stats(inode, size, type) {
    if (this !instanceof Stats)
        return new Stats(inode, size);

    // Not implemented yet
    this.gid = 0;
    this.uid = 0;
    this.mode = 0;
    this.rdev = 0;
    this.dev = 0;
    this.blocks = 0;
    this.blksize = 0;

    if (typeof inode == 'object' && size === undefined) {
        for (var k in inode) {
            this[k] = inode[k];
        }
    } else {
        var date = Date.now();
        this.ino = inode;
        this.size = size;
        this.atime = this.mtime = this.ctime = date;
        this.nlink = 1;
        this._type = type;
    }
}

Stats.prototype.isFile = function() {
    return this._type == 'file';
}

Stats.prototype.isDirectory = function() {
    return this._type == 'directory';
}

Stats.prototype.isBlockDevice = function() {
    return false;
}

Stats.prototype.isCharacterDevice = function() {
    return false;
}

Stats.prototype.isSymbolicLink = function() {
    return this._type == 'symlink';
}

Stats.prototype.isFIFO = function() {
    return false;
}

Stats.prototype.isSocket = function() {
    return false;
}

module.exports = Stats;