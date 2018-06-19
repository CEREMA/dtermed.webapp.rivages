App.view.define('VEdImage', {
    extend: "Ext.window.Window",
    alias: "widget.VEdImage",
    initComponent: function () {
        var me = this;

        me.Tpl = '<table class="BackgroundSystem" width="100%" height="100%"><tr><td align="center" valign="middle" width="100%" height="100%"><img id="EdImage" src=""></img></td></tr></table>';

        this.COORDS = {};
        this.width = 1024;
        this.height = 700;
        this.title = "Editeur d'image";
        this.bodyCls = "BackgroundSystem";
        this.layout = "fit";
        this.bbar = [
            '->',
            {
                text: "< Précédent",
                disabled: true,
                itemId: "PREC",
                handler: function () {
                    $('#EdImage').attr('src', me.itm[me.ndx - 2].data.url.replace('thumbs', 'images'));
                    me.ndx--;
                    if (me.ndx == 1) App.get(me, 'button#PREC').setDisabled(true);
                    else App.get(me, 'button#PREC').setDisabled(false);
                    if (me.ndx == me.total) App.get(me, 'button#NEXT').setDisabled(true);
                    else App.get(me, 'button#NEXT').setDisabled(false);
                }
            },
            {
                text: "Suivant >",
                disabled: true,
                itemId: "NEXT",
                handler: function () {
                    $('#EdImage').attr('src', me.itm[me.ndx].data.url.replace('thumbs', 'images'));
                    me.ndx++;
                    if (me.ndx == 1) App.get(me, 'button#PREC').setDisabled(true);
                    else App.get(me, 'button#PREC').setDisabled(false);
                    if (me.ndx == me.total) App.get(me, 'button#NEXT').setDisabled(true);
                    else App.get(me, 'button#NEXT').setDisabled(false);
                }
            }
        ];
        this.tbar = [{
                xtype: "button",
                iconCls: "btn_cursor",
                handler: function () {
                    if (me.crop) {
                        me.crop.clear();
                        me.crop.destroy();
                    };
                    me.COORDS = {};
                }
            },
            {
                xtype: "button",
                iconCls: "btn_rotate",
                handler: function () {

                    me.COORDS = {};
                    var d = new Date();
                    $('#EdImage').attr('src', '/rotate/' + d.getTime() + '/' + me.tkid + '/' + me.filename);
                    if (me.crop) me.crop.destroy();

                }
            },
            {
                xtype: "button",
                iconCls: "btn_blur",
                handler: function () {
                    me.crop = new Cropper(document.getElementById('EdImage'), {
                        autoCrop: false,
                        crop: function (event) {
                            me.COORDS = [
                                event.detail.x,
                                event.detail.y,
                                event.detail.width,
                                event.detail.height
                            ];
                        },
                        cropend: function () {
                            var d = new Date();
                            $('#EdImage').attr('src', '/blur/' + me.COORDS.join(',') + '/' + d.getTime() + '/' + me.tkid + '/' + me.filename);
                            if (me.crop) me.crop.destroy();
                        }
                    });

                }
            },
            '->',
            {
                xtype: "button",
                text: "<b>Reset</b>",
                handler: function () {
                    if (me.crop) me.crop.clear();
                    me.COORDS = {};
                    var d = new Date();
                    $('#EdImage').attr('src', '/reset/' + d.getTime() + '/' + me.tkid + '/' + me.filename);
                }
            }
        ];
        this.items = [{
            html: me.Tpl
        }];

        this.listeners = {
            "close": function (me) {
                App.get('mainform dataview#d0').getStore().load();
            },
            "show": function (p) {
                var d = new Date();
                if (me.ndx == 1) App.get(me, 'button#PREC').setDisabled(true);
                else App.get(me, 'button#PREC').setDisabled(false);
                if (me.ndx == me.total) App.get(me, 'button#NEXT').setDisabled(true);
                else App.get(me, 'button#NEXT').setDisabled(false);
                $('#EdImage').attr('src', '/images/' + d.getTime() + '/' + this.tkid + '/' + this.filename);
            }
        };

        this.callParent(arguments);

    }
});