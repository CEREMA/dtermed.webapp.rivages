var Map = {
    getAll: function(o, cb) {
        Map.using('db').model('rivages', 'SELECT import_segments.tkid, import_segments.OGR_FID,annee,mois,jour,heure,code_li,country,area,region,locality FROM import_segments order by annee desc,mois desc,jour desc,heure desc', cb)
    },
    delete: function(o, cb) {
        Map.using('db').query('rivages', 'UPDATE import_segments SET status=0 WHERE tkid in ("' + o.join(',') + '")', cb);
        /*
        Map.using('db').query('rivages','DELETE FROM tokens WHERE tkid in ("'+o.join(',')+'")',function(e,r) {
        	Map.using('db').query('rivages','DELETE FROM import_segments WHERE tkid in ("'+o.join(',')+'")',function(e,r) {
        		Map.using('db').query('rivages','DELETE FROM import_points WHERE tkid in ("'+o.join(',')+'")',function(e,r) {
        			Map.using('db').query('rivages','DELETE FROM import_photos WHERE tkid in ("'+o.join(',')+'")',function(e,r) {
        				Map.using('db').query('rivages','DELETE FROM save_photos WHERE tkid in ("'+o.join(',')+'")',function(e,r) {
        					cb();
        				});
        			});	
        		});
        	});
        });
        */
    }
};

module.exports = Map;