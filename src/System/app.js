App = {
	init: function (app, server) {
		var URL = "https://rivages.siipro.fr"
		String.prototype.qstr = function () {
			if (!this) return "";
			else {
				var response = this.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
					switch (char) {
						case "\0":
							return "\\0";
						case "\x08":
							return "\\b";
						case "\x09":
							return "\\t";
						case "\x1a":
							return "\\z";
						case "\n":
							return "\\n";
						case "\r":
							return "\\r";
						case "\"":
						case "'":
						case "\\":
						case "%":
							return "\\" + char; // prepends a backslash to backslash, percent,
							// and double/single quotes
					}
				});
				return '"' + response + '"';
			}
		};
		/** 
		 * 
		 * UPLOAD API 
		 * 
		 */

		var upload = App.using('express-fileupload');
		app.use(upload());
		app.post('/', app.UPLOAD.any(), function (req, res, next) {
			App.upload.up(req, res);
		});
		app.post('/token', function (req, res) {
			var fs = require('fs');
			var path = require('path');
			var uid = require('shortid').generate();
			console.log('DID: ' + req.body.did);
			console.log('MD5: ' + req.body.md5);
			console.log('NAM: ' + req.body.nam);
			console.log('---');
			var db = App.using('db');
			db.query('rivages', 'SELECT * FROM tokens WHERE md5="' + req.body.md5 + '"', function (error, results, fields) {
				if (results.length == 0) {
					console.log('INSERT INTO tokens VALUES ("' + uid + '","' + req.body.did + '","' + req.body.md5 + '","' + req.body.nam + '","' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '")');
					db.query('rivages', 'INSERT INTO tokens VALUES ("' + uid + '","' + req.body.did + '","' + req.body.md5 + '","' + req.body.nam + '","' + new Date().toISOString().slice(0, 19).replace('T', ' ') + '")', function (error, results, fields) {
						res.end(JSON.stringify({
							url: URL + "/upload/" + uid
						}));
					});
				} else {
					var r = results[0];
					// A token has already been assigned
					fs.stat(__dirname + path.sep + ".." + path.sep + "archives" + path.sep + r.name, function (err, stat) {
						if (err) {
							res.end(JSON.stringify({
								url: URL + "/upload/" + r.tkid
							}));
						} else return res.status(409).send('Already uploaded.');
					});
				}
			});
		});
		app.post('/up', function (req, res) {
			function _move(files, ndx, cb) {
				var path = require('path');
				if (!files[ndx]) return cb();
				files[ndx].mv(__dirname + path.sep + "archives" + path.sep + files[ndx].name, function (err) {
					_move(files, ndx + 1, cb);
				});
			};
			var UP = [];
			for (var el in req.files) {
				UP.push(req.files[el]);
			};

			_move(UP, 0, function () {
				res.end('OK');
			});
		});
		app.post('/upload/(*)', function (req, res) {
			var fs = require('fs');
			var path = require('path');
			var md5File = require('md5-file');
			if (!req.files) return res.status(400).send('No files were uploaded.');
			if (req.originalUrl.split('/').length <= 1) return res.status(400).send('');
			var uid = req.originalUrl.substr(req.originalUrl.lastIndexOf('/') + 1, req.originalUrl.length);
			var db = App.using('db');
			var zip = req.files.zip;
			zip.mv(__dirname + path.sep + "archives" + path.sep + zip.name, function (err) {
				if (err) return res.status(500).send(err);
				db.query('rivages', 'SELECT * FROM tokens WHERE tkid="' + uid + '"', function (error, results) {
					if (error) return res.status(500).send(error);
					if (results.length == 0) return res.status(403).send("Bad token");
					var r = results[0];
					var md5 = r.md5;
					md5File(__dirname + path.sep + "archives" + path.sep + zip.name, function (err, hash) {
						if (err) return res.status(500).send(err);
						if (hash == r.md5) {
							res.end('File uploaded!');
						} else {
							fs.unlink(__dirname + path.sep + "archives" + path.sep + zip.name, function () {
								db.query('rivages', 'delete from tokens where tkid="' + r.tkid + '"', function () {
									return res.status(403).send("Bad md5");
								});
							});
						}
					});
				});

			});
		});

		/** 
		 * 
		 * IMAGE API
		 * 
		 */

		app.get('/reset/(*)', function (req, res) {
			var url = req.originalUrl.split('/');
			var tkid = url[3];
			var filename = url[4];
			var db = App.using('db');
			var im = App.using('jimp');
			db.query('rivages', 'select picture from save_photos where tkid="' + tkid + '" and filename="' + filename + '"', function (e, r) {
				if (e) {
					res.status(404).send(e);
					return;
				};
				r = r[0].picture;
				db.query('rivages', 'update import_photos set picture="' + r + '" where tkid="' + tkid + '" and filename="' + filename + '"', function (err, rrr) {
					var buf = Buffer.from(r, 'base64');
					im.read(buf, function (err, img) {
						img.exifRotate()
							.quality(80)
							.getBuffer(im.MIME_JPEG, function (err, buffer) {
								res.set("Content-Type", im.MIME_JPEG);
								res.send(buffer);
							});
					});
				});
			});
		});
		app.get('/rotate/(*)', function (req, res) {
			var url = req.originalUrl.split('/');
			var im = App.using('jimp');
			var tkid = url[3].qstr();
			var filename = url[4].qstr();
			var db = App.using('db');
			db.query('rivages', 'select picture from import_photos where tkid=' + tkid + ' and filename=' + filename, function (e, r) {
				if (e) {
					res.status(404).send(e);
					return;
				};
				if (r.length == 0) {
					res.status(404).send(e);
					return;
				};
				r = r[0].picture;

				var buf = Buffer.from(r, 'base64');
				im.read(buf, function (err, img) {
					img.rotate(90)
						.quality(80)
						.getBuffer(im.MIME_JPEG, function (err, buffer) {
							var b64 = buffer.toString('base64').qstr();
							db.query('rivages', 'UPDATE import_photos SET picture=' + b64 + ' where tkid=' + tkid + ' and filename=' + filename, function (e, r) {
								res.set("Content-Type", im.MIME_JPEG);
								res.send(buffer);
							});
						});
				});




			});
		});
		app.get('/blur/(*)', function (req, res) {
			var url = req.originalUrl.split('/');
			var im = App.using('jimp');

			var tkid = url[4].qstr();
			var filename = url[5].qstr();
			var sq = url[2].split(',');
			var db = App.using('db');
			db.query('rivages', 'select picture from import_photos where tkid=' + tkid + ' and filename=' + filename, function (e, r) {
				if (e) {
					res.status(404).send(e);
					return;
				};
				if (r.length == 0) {
					res.status(404).send(e);
					return;
				};
				r = r[0].picture;
				var buf = Buffer.from(r, 'base64');
				im.read(buf, function (err, img) {
					img.exifRotate()
						.pixelate(10, sq[0] * 1, sq[1] * 1, sq[2] * 1, sq[3] * 1)
						.quality(80)
						.getBuffer(im.MIME_JPEG, function (err, buffer) {
							var b64 = buffer.toString('base64').qstr();
							db.query('rivages', 'UPDATE import_photos SET picture=' + b64 + ' where tkid=' + tkid + ' and filename=' + filename, function (e, r) {
								res.writeHead(200, {
									"Content-Type": "image/jpeg"
								});
								res.end(buffer);
							});

						});
				});

			});
		});
		app.get('/thumbs/(*)', function (req, res) {
			var url = req.originalUrl.split('/');

			var im = App.using('jimp');
			var tkid = url[3];
			var filename = url[4];

			var db = App.using('db');

			db.query('rivages', 'select picture from import_photos where tkid="' + tkid + '" and filename="' + filename + '"', function (e, r) {
				if (e) {
					res.status(404).send(e);
					return;
				};
				if (r.length == 0) {
					res.status(404).send(e);
					return;
				};
				r = r[0].picture;
				var buf = Buffer.from(r, 'base64');
				im.read(buf, function (err, img) {
					console.log(err);
					img.exifRotate()
						.resize(100, 100)
						.quality(80)
						.getBuffer(im.MIME_JPEG, function (err, buffer) {
							res.set("Content-Type", im.MIME_JPEG);
							res.send(buffer);
						});
				});
			});
		});
		app.get('/images/(*)', function (req, res) {
			var url = req.originalUrl.split('/');
			var tkid = url[3];
			var filename = url[4];
			var db = App.using('db');
			db.query('rivages', 'select picture from import_photos where tkid="' + tkid + '" and filename="' + filename + '"', function (e, r) {
				if (e) {
					res.status(404).send(e);
					return;
				};
				if (r.length == 0) {
					res.status(404).send(e);
					return;
				};
				r = r[0].picture;
				res.writeHead(200, {
					"Content-Type": "image/jpeg"
				});
				res.end(Buffer.from(r, 'base64'));
			});
		});

		/** 
		 * 
		 * GEOGRAPHIC API
		 * 
		 */

		app.get('/geojson', function (req, res) {
			if (req.query['tkid']) var sql = '(select ST_AsGeoJSON(SHAPE) from import where tkid in ("' + req.query['tkid'] + '"))';
			if (req.query['ofid']) var sql = '(select ST_AsGeoJSON(SHAPE) from import_segments where OGR_FID in (' + req.query['ofid'] + '))';
			if (!sql) {
				res.status('404').send('Not found.');
			} else {
				res.writeHead(200, {
					"Content-Type": "application/json"
				});
				console.log(sql);
				App.using('db').query('rivages', sql, function (e, r) {

					var info = {
						"type": "FeatureCollection",
						"features": []
					};
					for (var j = 0; j < r.length; j++) {
						for (var el in r[j]) {
							console.log(el);
							console.log(r[j]);
							info.features.push({
								"type": "Feature",
								"properties": {},
								"geometry": r[j][el]
							});
						}
					}
					res.end(JSON.stringify(info));
				});

			}
		});
		app.get('/export/points', function (req, res) {
			var admZip = require('adm-zip');
			var ogr2ogr = require('ogr2ogr');
			var db = App.using('db');
			var path = require('path');
			res.data = [];
			var out = new admZip();
			var prj = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';
			//if (!req.query.id) return res.status(404).send('Not found.');
			function composeZip(zipEntries, i, cb) {
				if (!zipEntries[i]) {
					cb();
					return;
				};
				var item = zipEntries[i];
				item.getDataAsync(function (data) {
					if (item.entryName.indexOf('shp') > -1) out.addFile("Rivages_Points.shp", data, '', 0644 << 16);
					if (item.entryName.indexOf('shx') > -1) out.addFile("Rivages_Points.shx", data, '', 0644 << 16);
					if (item.entryName.indexOf('dbf') > -1) out.addFile("Rivages_Points.dbf", data, '', 0644 << 16);
					composeZip(zipEntries, i + 1, cb);
				});
			};
			if (req.query.id) var WHERE = " where OGR_FID in (" + req.query.id + ")";
			else var WHERE = "";
			//var sql = "SELECT OGR_FID,SHAPE,track_fid,track_se_1,ele,time,fix,sat,hdop,vdop,pdop,time2 from import_points where astext(shape) like \'POINT%\' and tkid in (select tkid from import_segments" + WHERE + ")";
			var sql = "SELECT OGR_FID,SHAPE,track_fid,track_se_1,ele,time,fix,sat,hdop,vdop,pdop,time2,tokens.tkid `username` from import_points join tokens on tokens.tkid=import_points.tkid where astext(shape) like 'POINT%' and import_points.tkid in (select tkid from import_segments" + WHERE + ")";
			ogr2ogr("MYSQL:rivages,user=root,password=Mozave&31")
				.format('ESRI Shapefile')
				.options([
					'-sql',
					sql
				])
				.skipfailures()
				.stream()
				.on('data', function (chunk) {
					res.data.push(chunk);
				})
				.on('finish', function () {
					out.addFile("Rivages_Points.prj", new Buffer(prj), '', 0644 << 16);
					var zip = new admZip(Buffer.concat(res.data));
					var zipEntries = zip.getEntries();
					composeZip(zipEntries, 0, function () {
						res.contentType('application/zip');
						res.setHeader('content-disposition', 'attachment; filename=Rivages_Points.zip');
						out.toBuffer(function (buf) {
							res.end(buf);
						}, function (err) {
							return res.status(500).send('API ERROR.');
						});
					})
				})
		});
		app.get('/export/segments', function (req, res) {
			var admZip = require('adm-zip');
			var ogr2ogr = require('ogr2ogr');
			var db = App.using('db');
			var path = require('path');
			res.data = [];
			var out = new admZip();
			var prj = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';
			//if (!req.query.id) return res.status(404).send('Not found.');
			function composeZip(zipEntries, i, cb) {
				if (!zipEntries[i]) {
					cb();
					return;
				};
				var item = zipEntries[i];
				item.getDataAsync(function (data) {
					if (item.entryName.indexOf('shp') > -1) out.addFile("Rivages_Segments.shp", data, '', 0644 << 16);
					if (item.entryName.indexOf('shx') > -1) out.addFile("Rivages_Segments.shx", data, '', 0644 << 16);
					if (item.entryName.indexOf('dbf') > -1) out.addFile("Rivages_Segments.dbf", data, '', 0644 << 16);
					composeZip(zipEntries, i + 1, cb);
				});
			};
			if (req.query.id) var WHERE = " where OGR_FID in (" + req.query.id + ")";
			else var WHERE = "";
			//var sql = "SELECT OGR_FID,SHAPE,id,annee,mois,jour,heure,carto,user,apparei,code_li from import_segments where tkid in (select tkid from import_segments" + WHERE + ")";
			var sql = "SELECT OGR_FID,SHAPE,id,annee,mois,jour,heure,carto,user,apparei,code_li,tokens.imei `username` from import_segments join tokens on tokens.tkid=import_segments.tkid where import_segments.tkid in (select tkid from import_segments" + WHERE + ")";
			ogr2ogr("MYSQL:rivages,user=root,password=Mozave&31")
				.format('ESRI Shapefile')
				.options([
					'-sql',
					sql
				])
				.skipfailures()
				.stream()
				.on('data', function (chunk) {
					res.data.push(chunk);
				})
				.on('finish', function () {
					out.addFile("Rivages_Segments.prj", new Buffer(prj), '', 0644 << 16);
					var zip = new admZip(Buffer.concat(res.data));
					var zipEntries = zip.getEntries();
					composeZip(zipEntries, 0, function () {
						res.contentType('application/zip');
						res.setHeader('content-disposition', 'attachment; filename=Rivages_Segments.zip');
						out.toBuffer(function (buf) {
							res.end(buf);
						}, function (err) {
							return res.status(500).send('API ERROR.');
						});
					})
				})
		});
		app.get('/export/photos', function (req, res) {
			var admZip = require('adm-zip');
			var ogr2ogr = require('ogr2ogr');
			var db = App.using('db');
			var path = require('path');
			var gm = require('gm').subClass({
				imageMagick: true
			});
			res.data = [];
			var out = new admZip();
			var prj = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';
			var qpj = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';

			if (!req.query.id) return res.status(404).send('Not found.');

			//var sql = "SELECT OGR_FID,SHAPE,filename,`date and t`,`camera man`,latitude,longitude,`gps direct`, lien_photo from import_photos where tkid in (select tkid from import_segments where OGR_FID in (" + req.query.id + "))";
			var sql = "SELECT OGR_FID,SHAPE,filename,`date and t`,`camera man`,latitude,longitude,`gps direct`, lien_photo,tokens.imei `username` from import_photos join tokens on tokens.tkid=import_photos.tkid where import_photos.tkid in (select tkid from import_segments where OGR_FID in (" + req.query.id + "))";

			function composeZip(zipEntries, i, cb) {
				if (!zipEntries[i]) {
					cb();
					return;
				};
				var item = zipEntries[i];
				item.getDataAsync(function (data) {
					if (item.entryName.indexOf('shp') > -1) out.addFile("Rivages_Photos.shp", data, '', 0644 << 16);
					if (item.entryName.indexOf('shx') > -1) out.addFile("Rivages_Photos.shx", data, '', 0644 << 16);
					if (item.entryName.indexOf('dbf') > -1) out.addFile("Rivages_Photos.dbf", data, '', 0644 << 16);
					composeZip(zipEntries, i + 1, cb);
				});
			};

			function composePhotos(r, i, cb) {
				if (!r[i]) {
					cb();
					return;
				};
				var filename = r[i].filename;
				var buf = Buffer.from(r[i].picture, 'base64');
				gm(buf)
					.draw(['gravity NorthEast image over 0,0 0,0 "' + __dirname + path.sep + 'logo' + path.sep + 'Logo_Cerema_R.jpg' + '"'])
					//.autoOrient()
					.toBuffer('JPG', function (err, buffer) {
						out.addFile(filename, buffer, '', 0644 << 16);
						composePhotos(r, i + 1, cb);
					});
			};

			ogr2ogr("MYSQL:rivages,user=root,password=Mozave&31")
				.format('ESRI Shapefile')
				.options([
					'-sql',
					sql
				])
				.skipfailures()
				.stream()
				.on('data', function (chunk) {
					res.data.push(chunk);
				})
				.on('finish', function () {
					out.addFile("Rivages_Photos.prj", new Buffer(prj), '', 0644 << 16);
					out.addFile("Rivages_Photos.qpj", new Buffer(qpj), '', 0644 << 16);
					var zip = new admZip(Buffer.concat(res.data));
					var zipEntries = zip.getEntries();
					composeZip(zipEntries, 0, function () {
						var sql = "select filename,picture from import_photos where tkid in (select tkid from import_segments where import_segments.ogr_FID in (" + req.query.id + "))";
						db.query('rivages', sql, function (e, r) {
							if (e) return res.status(500).send('API ERROR.');
							composePhotos(r, 0, function () {
								res.contentType('application/zip');
								res.setHeader('content-disposition', 'attachment; filename=Rivages_Photos.zip');
								out.toBuffer(function (buf) {
									res.end(buf);
								}, function (err) {
									return res.status(500).send('API ERROR.');
								});
							})
						});
					});
				})

		});


	}
};

module.exports = App;
