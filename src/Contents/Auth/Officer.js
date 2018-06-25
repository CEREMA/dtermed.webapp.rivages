Officer = {
    login: function (profile, cb) {

        if (profile.service == "cas") {
            if (!profile.username) cb({});
            var mail = profile.username.toLowerCase();
            Officer.using('db').query('bpclight', 'select kage,nom,prenom from agents where kage in (select kage from mela where libmela="' + mail + '")', function (err, result) {
                console.log(Officer.getProfile(mail.split('@')[0]));
                console.log(result);
                if (!err) {
                    var response = {
                        lastname: result[0].nom,
                        firstname: result[0].prenom,
                        uid: result[0].kage,
                        mail: mail,
                        profiles: Officer.getProfile(mail.split('@')[0])
                    };
                    cb(null, response);
                } else cb(err, null);
            });
            return;
        };
        if (profile.service == "letmein") {
            console.log('**********************');
            if (!profile.username) cb({});
            var mail = profile.username.toLowerCase();
            Officer.using('db').store('bpclight', 'select kage,nom,prenom from agents where kage in (select kage from mela where libmela="' + mail + '")', function (err, result) {
                console.log(Officer.getProfile(mail.split('@')[0]));
                if (!err) {
                    var response = {
                        lastname: result.data[0].nom,
                        firstname: result.data[0].prenom,
                        uid: result.data[0].kage,
                        mail: mail,
                        profiles: Officer.getProfile(mail.split('@')[0])
                    };
                    cb(null, response);
                } else cb(err, null);
            });
        };

    }
};

module.exports = Officer;