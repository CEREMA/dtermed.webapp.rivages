Rivages = {
    getAll: function (o, cb) {
        var db = Rivages.using('db');
        var SQL = [
            "SELECT tokens.IMEI,tokens.name filename,import_segments.tkid,import_segments.lang,import_segments.OGR_FID,CONCAT(import_segments.annee,'-',import_segments.mois,'-',import_segments.jour,' ',import_segments.heure) `date`,import_segments.annee,import_segments.mois,import_segments.jour,import_segments.heure,import_segments.code_li,import_segments.country,import_segments.area,import_segments.region,import_segments.locality",
            "FROM import_segments",
            "join tokens on (tokens.tkid=import_segments.tkid)",
            "WHERE status=1",
            "ORDER BY annee DESC,mois DESC,jour DESC,heure DESC"
        ];
        console.log(SQL.join(' '));
        db.model('rivages', SQL.join(' '), cb);
    }
}

module.exports = Rivages;