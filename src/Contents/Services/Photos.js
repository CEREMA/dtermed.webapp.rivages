Photos = {
	getAll: function (o, cb) {
		console.log('select filename,tkid,concat("/thumbs/",UUID(),"/",tkid,"/",filename) url from import_photos where tkid in ("' + o.tkid.split(',').join('","') + '")');
		Photos.using('db').model('rivages', 'select filename,tkid,concat("/thumbs/",UUID(),"/",tkid,"/",filename) url from import_photos where tkid in ("' + o.tkid.split(',').join('","') + '")', cb);
	}
}

module.exports = Photos;