var TMap = {};

function GMap(l, m) {
    TMap.map = new google.maps.Map(document.getElementById('TMapPanel'), {
        zoom: 10,
        center: {
            lat: -28,
            lng: 137
        },
        mapTypeId: 'satellite'
    });
    google.maps.event.trigger(TMap.map, 'resize');
    TMap.markers = [];
    TMap.setMarker = function (l, m, title, id) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(l, m),
            animation: google.maps.Animation.DROP,
            title: title,
            itemId: id
        });
        marker.setMap(TMap.map);
        marker.addListener('click', function (x) {
            var dir = this.itemId.split('|')[1] + '/rivages_' + this.itemId.split('|')[2];
            var d = new Date();
            dir = d.getTime() + "/" + dir;
            var infowindow = new google.maps.InfoWindow({
                content: [
                    '<div width="100%" align=center><img src="https://rivages.siipro.fr/thumbs/' + dir + '"></img></div>',
                    '<div><small>rivages_' + this.itemId.split('|')[2] + '</small></div>'
                ].join('')
            });
            console.log(this);
            infowindow.open(TMap.map, this);
        });
        TMap.markers.push(marker);
        return marker;
    };
    TMap.clearMarkers = function () {
        for (var i = 0; i < TMap.markers.length; i++) {
            TMap.markers[i].setMap(null);
        }
    };

};

App.view.define('VMain', {

    extend: 'Ext.Panel',
    alias: 'widget.mainform',
    border: false,

    layout: "border",

    items: [{
            region: 'north',
            height: 25,
            minHeight: 25,
            border: false,
            baseCls: 'cls-header',
            xtype: "Menu",
            itemId: "MenuPanel",
            menu: []
        },
        {
            region: "center",
            split: true,
            layout: "vbox",
            items: [{
                    layout: "hbox",
                    width: "100%",
                    height: 200,
                    items: [{
                        xtype: "grid",
                        itemId: "g0",
                        height: 200,
                        flex: 2,
                        multiSelect: true,
                        border: false,
                        tbar: [{
                                text: "Importer",
                                iconCls: "import",
                                handler: function () {
                                    var input = document.createElement('input');
                                    input.className = "uploadme";
                                    input.style.display = "none";
                                    input.type = "file";
                                    input.multiple = true;
                                    App.input = input;

                                    document.getElementsByTagName('body')[0].appendChild(input);
                                    document.querySelector('.uploadme').click();

                                    document.querySelector('.uploadme').addEventListener('change', function (e) {
                                        var files = e.target.files;

                                        function upload(files, ndx, cb) {
                                            if (!files[ndx]) return cb();
                                            var file = files[ndx];
                                            App.notify('Téléchargement de ' + file.name);

                                            var formData = new FormData();
                                            formData.append(file.name, file);

                                            var xhr = new XMLHttpRequest();
                                            var method = "POST";
                                            var url = "/up";

                                            xhr.open(method, url, true);

                                            xhr.setRequestHeader(this.filenameHeader, file.name);
                                            xhr.setRequestHeader(this.sizeHeader, file.size);
                                            xhr.setRequestHeader(this.typeHeader, file.type);

                                            xhr.addEventListener('loadend', function () {
                                                upload(files, ndx + 1, cb);
                                            }, true);
                                            xhr.upload.addEventListener("progress", function () {
                                                console.log('xxx');
                                            }, true);
                                            xhr.send(formData);

                                        };
                                        upload(files, 0, function () {
                                            App.notify('Le téléchargement est terminé.');
                                        });
                                    });
                                }
                            }, {
                                text: "Exporter",
                                iconCls: "export",
                                menu: [{
                                        text: "Photos",
                                        handler: function (me) {
                                            var grid = me.up('grid');
                                            var s = grid.getSelectionModel().getSelection();
                                            var OGRFID = [];
                                            for (var i = 0; i < s.length; i++) OGRFID.push(s[i].data.OGR_FID);
                                            var iframe = document.createElement('iframe');
                                            iframe.src = "https://rivages.siipro.fr/export/photos?id=" + OGRFID.join(',');
                                            iframe.style.display = "none";
                                            document.getElementsByTagName('body')[0].appendChild(iframe);
                                        }
                                    },
                                    {
                                        text: "Points",
                                        handler: function (me) {
                                            var grid = me.up('grid');
                                            var s = grid.getSelectionModel().getSelection();
                                            var OGRFID = [];
                                            for (var i = 0; i < s.length; i++) OGRFID.push(s[i].data.OGR_FID);
                                            var iframe = document.createElement('iframe');
                                            iframe.src = "https://rivages.siipro.fr/export/points?id=" + OGRFID.join(',');
                                            iframe.style.display = "none";
                                            document.getElementsByTagName('body')[0].appendChild(iframe);
                                        }
                                    },
                                    {
                                        text: "Segments",
                                        handler: function (me) {
                                            var grid = me.up('grid');
                                            var s = grid.getSelectionModel().getSelection();
                                            var OGRFID = [];
                                            for (var i = 0; i < s.length; i++) OGRFID.push(s[i].data.OGR_FID);
                                            var iframe = document.createElement('iframe');
                                            iframe.src = "https://rivages.siipro.fr/export/segments?id=" + OGRFID.join(',');
                                            iframe.style.display = "none";
                                            document.getElementsByTagName('body')[0].appendChild(iframe);
                                        }
                                    }
                                ]
                            },
                            {
                                text: "Actualiser",
                                iconCls: "refresh",
                                handler: function (me) {
                                    me.up('grid').getStore().load();
                                }
                            }
                        ],
                        features: [{
                            ftype: 'groupingsummary',
                            groupHeaderTpl: '{name}',
                            hideGroupedHeader: false,
                            enableGroupingMenu: true
                        }],
                        columns: [{
                                text: "Date",
                                dataIndex: "date"
                            },
                            {
                                text: "Limite",
                                dataIndex: "code_li",
                                flex: 1
                            },
                            {
                                text: "Utilisateur",
                                dataIndex: "IMEI",
                                width: 140
                            },
                            {
                                text: "Fichier",
                                dataIndex: "filename",
                                width: 180
                            },
                            {
                                text: "Ville",
                                dataIndex: "locality"
                            },
                            {
                                text: "Département",
                                dataIndex: "area"
                            },
                            {
                                text: "Région",
                                dataIndex: "region"
                            },
                            {
                                text: "Pays",
                                dataIndex: "country"
                            },
                            {
                                text: "Langue",
                                dataIndex: "lang"
                            }
                        ],
                        store: App.store.create("App.Rivages.getAll", {
                            autoLoad: false
                        })
                    }, {
                        xtype: "dataview",
                        itemId: "d0",
                        id: "images-view",
                        autoScroll: true,
                        height: 200,
                        store: App.store.create('App.Photos.getAll'),
                        tpl: [
                            '<tpl for=".">',
                            '<div class="thumb-wrap" id="{name:stripTags}">',
                            '<div class="thumb"><img src="{url}" title="{name:htmlEncode}"></div>',
                            '<span class="x-editable">{shortName:htmlEncode}</span>',
                            '</div>',
                            '</tpl>',
                            '<div class="x-clear"></div>'
                        ],
                        selectionModel: {
                            mode: 'SINGLE'
                        },
                        trackOver: true,
                        overItemCls: 'x-item-over',
                        itemSelector: 'div.thumb-wrap',
                        flex: 1
                    }]
                },
                {
                    itemId: "MyGMapPanel",
                    itemId: "map",
                    flex: 2,
                    html: '<div id="TMapPanel" style="width:100%;height:100%"></div>',
                    padding: 0,
                    border: false,
                    width: "100%",
                    border: false,
                    split: true
                }
            ]
        }
    ]

});