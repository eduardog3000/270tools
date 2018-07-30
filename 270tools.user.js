// ==UserScript==
// @name         270tools
// @namespace    https://github.com/eduardog3000
// @version      0.2
// @description  Tool for 270 to Win Presidential Map. Can remove states, grant statehood to territories, and change the number of senators and house reps (and therefore total electoral votes).
// @author       eduardog3000
// @license      0BSD
// @match        https://www.270towin.com/
// @grant        GM_getResourceText
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/floatthead/2.1.2/jquery.floatThead.js
// @require      https://cdn.datatables.net/1.10.19/js/jquery.dataTables.min.js
// @resource     dataTableCSS https://cdn.datatables.net/1.10.18/css/jquery.dataTables.min.css
// ==/UserScript==

(function() {
    'use strict';

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css.replace(/;/g, ' !important;');
        head.appendChild(style);
    }

    addGlobalStyle(GM_getResourceText('dataTableCSS'));

    addGlobalStyle(`
    #territories {
        width: 50% !important;
    }

    thead {
        background: white;
    }

    .cell-center {
        text-align: center;
    }

    .pop {
        text-align: right;
    }

    #DC-name {
        display: none;
        font-family: inherit;
        font-size: inherit;
        padding: none;
        width: 95%;
    }

    /*
    #a23-extra {
        display: none;
    }
    */

    #custom-abbr {
        width: 25px;
    }

    #custom-census, #custom-est {
        width: 75px;
        appearance: textfield;
        -moz-appearance: textfield;
        -webkit-appearance: textfield;
    }

    .settings-modal-hidden {
        display: none;
    }

    .settings-modal-shown {
        display: block;
    }

    #settings-modal {
        position: fixed;
        z-index: 1001;
        left: 0;
        top: 0;
        width: 100%; /* Full width */
        height: 100%; /* Full height */
        overflow: auto; /* Enable scroll if needed */
        background-color: rgb(0,0,0); /* Fallback color */
        background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    }

    #settings {
        background-color: #fefefe;
        margin: 15% auto; /* 15% from the top and centered */
        padding: 20px;
        border: 1px solid #888;
        width: 80%; /* Could be more or less, depending on screen size */
    }

    /* The Close Button */
    .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
    }

    .close:hover,
    .close:focus {
        color: black;
        text-decoration: none;
        cursor: pointer;
    }
    `);

    String.prototype.formatUnicorn = function() {
        //"use strict";
        var str = this.toString();
        if(arguments.length) {
            var t = typeof arguments[0];
            var key;
            var args = ("string" === t || "number" === t) ?
                Array.prototype.slice.call(arguments)
                : arguments[0];

            for(key in args) {
                str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
            }
        }

        return str;
    };

    var territories = [
        {abbr: 'AL', name: 'Alabama', fips: '01', pro: 4918973, est: 4874747, census: 4780127, is_state: true, current_ev: 9},
        {abbr: 'AK', name: 'Alaska', fips: '02', pro: 753900, est: 739795, census: 710249, is_state: true, current_ev: 3},
        {abbr: 'AS', name: 'American Samoa', fips: '03', pro: 55519, est: 55519, census: 55519, is_state: false, current_ev: 0},
        {abbr: 'AZ', name: 'Arizona', fips: '04', pro: 7330167, est: 7016270, census: 6392307, is_state: true, current_ev: 11},
        {abbr: 'AR', name: 'Arkansas', fips: '05', pro: 3045986, est: 3004279, census: 2915958, is_state: true, current_ev: 6},
        {abbr: 'CA', name: 'California', fips: '06', pro: 40646714, est: 39536653, census: 37252895, is_state: true, current_ev: 55},
        {abbr: 'CO', name: 'Colorado', fips: '08', pro: 5902421, est: 5607154, census: 5029324, is_state: true, current_ev: 9},
        {abbr: 'CT', name: 'Connecticut', fips: '09', pro: 3594666, est: 3588184, census: 3574118, is_state: true, current_ev: 7},
        {abbr: 'DE', name: 'Delaware', fips: '10', pro: 993365, est: 961939, census: 897936, is_state: true, current_ev: 3},
        {abbr: 'DC', name: 'District of Columbia', fips: '11', pro: 742708, est: 693972, census: 601767, is_state: false, current_ev: 3},
        {abbr: 'FL', name: 'Florida', fips: '12', pro: 22099273, est: 20984400, census: 18804623, is_state: true, current_ev: 29},
        {abbr: 'GA', name: 'Georgia', fips: '13', pro: 10794819, est: 10429379, census: 9688681, is_state: true, current_ev: 16},
        {abbr: 'GU', name: 'Guam', fips: '14', pro: 159358, est: 159358, census: 159358, is_state: false, current_ev: 0},
        {abbr: 'HI', name: 'Hawaii', fips: '15', pro: 1459878, est: 1427538, census: 1360301, is_state: true, current_ev: 4},
        {abbr: 'ID', name: 'Idaho', fips: '16', pro: 1791884, est: 1716943, census: 1567652, is_state: true, current_ev: 4},
        {abbr: 'IL', name: 'Illinois', fips: '17', pro: 12788504, est: 12802023, census: 12831549, is_state: true, current_ev: 20},
        {abbr: 'IN', name: 'Indiana', fips: '18', pro: 6752879, est: 6666818, census: 6484229, is_state: true, current_ev: 11},
        {abbr: 'IA', name: 'Iowa', fips: '19', pro: 3192483, est: 3145711, census: 3046869, is_state: true, current_ev: 6},
        {abbr: 'KS', name: 'Kansas', fips: '20', pro: 2941197, est: 2913123, census: 2853132, is_state: true, current_ev: 6},
        {abbr: 'KY', name: 'Kentucky', fips: '21', pro: 4508217, est: 4454189, census: 4339349, is_state: true, current_ev: 8},
        {abbr: 'LA', name: 'Louisiana', fips: '22', pro: 4755775, est: 4684333, census: 4533479, is_state: true, current_ev: 8},
        {abbr: 'ME', name: 'Maine', fips: '23', pro: 1339385, est: 1335907, census: 1328361, is_state: true, current_ev: 4},
        {abbr: 'MD', name: 'Maryland', fips: '24', pro: 6185926, est: 6052177, census: 5773785, is_state: true, current_ev: 10},
        {abbr: 'MA', name: 'Massachusetts', fips: '25', pro: 7009634, est: 6859819, census: 6547817, is_state: true, current_ev: 11},
        {abbr: 'MI', name: 'Michigan', fips: '26', pro: 9998426, est: 9962311, census: 9884129, is_state: true, current_ev: 16},
        {abbr: 'MN', name: 'Minnesota', fips: '27', pro: 5708010, est: 5576606, census: 5303925, is_state: true, current_ev: 10},
        {abbr: 'MS', name: 'Mississippi', fips: '28', pro: 2991471, est: 2984100, census: 2968103, is_state: true, current_ev: 6},
        {abbr: 'MO', name: 'Missouri', fips: '29', pro: 6171833, est: 6113532, census: 5988927, is_state: true, current_ev: 10},
        {abbr: 'MT', name: 'Montana', fips: '30', pro: 1080214, est: 1050493, census: 989417, is_state: true, current_ev: 3},
        {abbr: 'NE', name: 'Nebraska', fips: '31', pro: 1965243, est: 1920076, census: 1826341, is_state: true, current_ev: 5},
        {abbr: 'NV', name: 'Nevada', fips: '32', pro: 3149328, est: 2998039, census: 2700691, is_state: true, current_ev: 6},
        {abbr: 'NH', name: 'New Hampshire', fips: '33', pro: 1355104, est: 1342795, census: 1316466, is_state: true, current_ev: 4},
        {abbr: 'NJ', name: 'New Jersey', fips: '34', pro: 9105974, est: 9005644, census: 8791936, is_state: true, current_ev: 14},
        {abbr: 'NM', name: 'New Mexico', fips: '35', pro: 2101491, est: 2088070, census: 2059192, is_state: true, current_ev: 5},
        {abbr: 'NY', name: 'New York', fips: '36', pro: 20070659, est: 19849399, census: 19378087, is_state: true, current_ev: 29},
        {abbr: 'NC', name: 'North Carolina', fips: '37', pro: 10637703, est: 10273419, census: 9535692, is_state: true, current_ev: 15},
        {abbr: 'ND', name: 'North Dakota', fips: '38', pro: 798016, est: 755393, census: 672591, is_state: true, current_ev: 3},
        {abbr: 'MP', name: 'Northern Mariana Islands', fips: '69', pro: 53883, est: 53883, census: 53883, is_state: false, current_ev: 0},
        {abbr: 'OH', name: 'Ohio', fips: '39', pro: 11715063, est: 11658609, census: 11536725, is_state: true, current_ev: 18},
        {abbr: 'OK', name: 'Oklahoma', fips: '40', pro: 4016945, est: 3930864, census: 3751616, is_state: true, current_ev: 7},
        {abbr: 'OR', name: 'Oregon', fips: '41', pro: 4297264, est: 4142776, census: 3831073, is_state: true, current_ev: 7},
        {abbr: 'PA', name: 'Pennsylvania', fips: '42', pro: 12852967, est: 12805537, census: 12702887, is_state: true, current_ev: 20},
        {abbr: 'PR', name: 'Puerto Rico', fips: '72', pro: 3337177, est: 3337177, census: 3726157, is_state: false, current_ev: 0},
        {abbr: 'RI', name: 'Rhode Island', fips: '44', pro: 1062733, est: 1059639, census: 1052931, is_state: true, current_ev: 4},
        {abbr: 'SC', name: 'South Carolina', fips: '45', pro: 5223002, est: 5024369, census: 4625401, is_state: true, current_ev: 9},
        {abbr: 'SD', name: 'South Dakota', fips: '46', pro: 896824, est: 869666, census: 814191, is_state: true, current_ev: 3},
        {abbr: 'TN', name: 'Tennessee', fips: '47', pro: 6895305, est: 6715984, census: 6346275, is_state: true, current_ev: 11},
        {abbr: 'TX', name: 'Texas', fips: '48', pro: 29934070, est: 28304596, census: 25146105, is_state: true, current_ev: 38},
        {abbr: 'VI', name: 'U.S. Virgin Islands', fips: '52', pro: 106405, est: 106405, census: 106405, is_state: false, current_ev: 0},
        {abbr: 'UT', name: 'Utah', fips: '49', pro: 3275665, est: 3101833, census: 2763888, is_state: true, current_ev: 6},
        {abbr: 'VT', name: 'Vermont', fips: '50', pro: 622703, est: 623657, census: 625745, is_state: true, current_ev: 3},
        {abbr: 'VA', name: 'Virginia', fips: '51', pro: 8697577, est: 8470020, census: 8001045, is_state: true, current_ev: 13},
        {abbr: 'WA', name: 'Washington', fips: '53', pro: 7749587, est: 7405743, census: 6724543, is_state: true, current_ev: 12},
        {abbr: 'WV', name: 'West Virginia', fips: '54', pro: 1799160, est: 1815857, census: 1853011, is_state: true, current_ev: 5},
        {abbr: 'WI', name: 'Wisconsin', fips: '55', pro: 5846015, est: 5795483, census: 5687289, is_state: true, current_ev: 10},
        {abbr: 'WY', name: 'Wyoming', fips: '56', pro: 586638, est: 579315, census: 563767, is_state: true, current_ev: 3},
        {abbr: 'EX', name: 'Extra', fips: '99', pro: 0, est: 0, census: 0, is_state: false, current_ev: 0}
    ];

    $('#view_container').css('left', '1000px');

    $('#map').append(`
<div style="position:absolute;top:430px;left:370px;width:200px">
    <table class="unbootstrap" style="float:left" cellspacing="5">
        <tbody>
            <tr>
                <td id="sp_03" class="map_text sp_state" style="width: 13px; height: 20px; background-color: rgb(187, 170, 144); display: none;">0</td>
                <td id="sp_14" class="map_text sp_state" style="width: 13px; height: 20px; background-color: rgb(187, 170, 144); display: none;">0</td>
                <td id="sp_69" class="map_text sp_state" style="width: 13px; height: 20px; background-color: rgb(187, 170, 144); display: none;">0</td>
            </tr>
            <tr>
                <td id="abbr_03" class="map_text" style="text-align:center; display: none;">AS</td>
                <td id="abbr_14" class="map_text" style="text-align:center; display: none;">GU</td>
                <td id="abbr_69" class="map_text" style="text-align:center; display: none;">MP</td>
            </tr>
        </tbody>
    </table>
    <table class="unbootstrap" style="float:right" cellspacing="5">
        <tbody>
            <tr>
                <td id="sp_72" class="map_text sp_state" style="width: 13px; height: 20px; background-color: rgb(187, 170, 144); display: none;">0</td>
                <td id="sp_52" class="map_text sp_state" style="width: 13px; height: 20px; background-color: rgb(187, 170, 144); display: none;">0</td>
                <td id="sp_99" class="map_text sp_state" style="width: 13px; height: 20px; background-color: rgb(187, 170, 144); display: none;">0</td>
            </tr>
            <tr>
                <td id="abbr_72" class="map_text" style="text-align:center; display: none;">PR</td>
                <td id="abbr_52" class="map_text" style="text-align:center; display: none;">VI</td>
                <td id="abbr_99" class="map_text" style="text-align:center; display: none;">23<sup>rd</sup></td>
            </tr>
        </tbody>
    </table>
</div>
`);

    $("g.states").append(`
<path class="state" id="03" fill="#BBAA90"></path>
<path class="state" id="14" fill="#BBAA90"></path>
<path class="state" id="69" fill="#BBAA90"></path>
<path class="state" id="52" fill="#BBAA90"></path>
<path class="state" id="99" fill="#BBAA90"></path>
`);
    $("#72").attr("fill", "#BBAA90")

    m.states['03'] = {"state_abbr":"AS","e_votes":"0","outcome":0,"state_name":"American Samoa"}
    m.states['14'] = {"state_abbr":"GU","e_votes":"0","outcome":0,"state_name":"Guam"}
    m.states['69'] = {"state_abbr":"MP","e_votes":"0","outcome":0,"state_name":"Northen Mariana Islands"}
    m.states['72'] = {"state_abbr":"PR","e_votes":"0","outcome":0,"state_name":"Puerto Rico"}
    m.states['52'] = {"state_abbr":"VI","e_votes":"0","outcome":0,"state_name":"U.S. Virgin Islands"}
    m.states['99'] = {"state_abbr":"EX","e_votes":"0","outcome":0,"state_name":"23rd Amendment"}

    m.specialStates = ["23", "25", "44", "09", "34", "10", "24", "11", "31", "03", "14", "69", "72", "52", "99"];

    var ontclick = function() {
        var state_id = $(this).attr("id").split("_");
        m.state_click( state_id[1], state_id[2] );
    };

    $("#sp_03").click(ontclick);
    $("#sp_14").click(ontclick);
    $("#sp_69").click(ontclick);
    $("#sp_72").click(ontclick);
    $("#sp_52").click(ontclick);
    $("#sp_99").click(ontclick);

    m.update_electoral_votes = function() {
        if (this.debug == 1) console.log('m.update_electoral_votes()');
        var t_total  = 0;
        var i_total  = 0;
        var r_total  = 0;
        var r1_total = 0;
        var r2_total = 0;
        var r4_total = 0;
        var d_total  = 0;
        var d1_total = 0;
        var d2_total = 0;
        var d4_total = 0;
        var t_states = 0; // Number of states undecided
        var n_states = 0; // Number of states not polled - polling-maps only
        var n_total = 0;

        var states = this.states;

        for (key in states) {
            if (key != "23" && key != "31") {
                if (states[key].outcome==0 ) {
                    t_total += parseInt(states[key].e_votes);
                    t_states++;
                } else if(states[key].outcome==1 ) {
                    d4_total += parseInt(states[key].e_votes);
                } else if(states[key].outcome==2 ) {
                    r4_total += parseInt(states[key].e_votes);
                } else if(states[key].outcome==3 ) {
                    d2_total += parseInt(states[key].e_votes);
                } else if(states[key].outcome==4 ) {
                    r2_total += parseInt(states[key].e_votes);
                } else if(states[key].outcome==5 ) {
                    d1_total += parseInt(states[key].e_votes);
                } else if(states[key].outcome==6 ) {
                    r1_total += parseInt(states[key].e_votes);
                } else if(states[key].outcome==7 ) {
                    i_total += parseInt(states[key].e_votes);
                } else if(states[key].outcome==9 ) {
                    n_total += parseInt(states[key].e_votes);
                }
            } else {
                for (spec_state in states[key]) {
                    //TODO not sure how to hande this with regard to R270
                    if (spec_state == "MX" || spec_state == "M3" || spec_state == "M4" || spec_state == "NX" ||
						spec_state == "N3" || spec_state == "N4" || spec_state == "N5")
					{
                        if (this.debug == 1) console.log(key+"="+spec_state+"="+states[key][spec_state]["outcome"]+"="+states[key][spec_state]["e_votes"]);
                        if (states[key][spec_state]["outcome"] == 0 ) {
                            t_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 1 ) {
                            d4_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 2 ) {
                            r4_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 3 ) {
                            d2_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 4 ) {
                            r2_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 5 ) {
                            d1_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 6 ) {
                            r1_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 7 ) {
                            i_total += parseInt(states[key][spec_state]["e_votes"]);
                        } else if(states[key][spec_state]["outcome"] == 9 ) {
                            n_total += parseInt(states[key][spec_state]["e_votes"]);
                        }
                    }
                }
            }
        }

        if (this.colorMode > 1 || d2_total || d1_total || r2_total || r1_total) {
            $(".hide3").show();
        }
        else {
            $(".hide3").hide();
        }

        if (d4_total > 9 ) {
            $("#d4_ev").html(d4_total);
            $("#d4_color").show();
        } else {
            if (d4_total == 0) {
                $("#d4_color").hide();
            } else {
                $("#d4_color").show();
                $("#d4_ev").html("");
            }
        }
        if (d2_total > 9 ) {
            $("#d2_ev").html(d2_total);
            $("#d2_color").show();
        } else {
            if (d2_total == 0) {
                $("#d2_color").hide();
            } else {
                $("#d2_color").show();
                $("#d2_ev").html("");
            }
        }
        if (d1_total > 9 ) {
            $("#d1_ev").html(d1_total);
            $("#d1_color").show();
        } else {
            if (d1_total == 0) {
                $("#d1_color").hide();
            } else {
                $("#d1_color").show();
                $("#d1_ev").html("");
            }
        }

        if (t_total > 9 ) {
            $("#t_color").html(t_total);
            $("#t_color").show();
        } else {
            if (t_total == 0) {
                $("#t_color").hide();
            } else {
                $("#t_color").show();
                $("#t_color").html("");
            }
        }

        if (r4_total > 9 ) {
            $("#r4_ev").html(r4_total);
            $("#r4_color").show();
        } else {
            if (r4_total == 0) {
                $("#r4_color").hide();
            } else {
                $("#r4_color").show();
                $("#r4_ev").html("");
            }
        }
        if (r2_total > 9 ) {
            $("#r2_ev").html(r2_total);
            $("#r2_color").show();
        } else {
            if (r2_total == 0) {
                $("#r2_color").hide();
            } else {
                $("#r2_color").show();
                $("#r2_ev").html("");
            }
        }
        if (r1_total > 9 ) {
            $("#r1_ev").html(r1_total);
            $("#r1_color").show();
        } else {
            if (r1_total == 0) {
                $("#r1_color").hide();
            } else {
                $("#r1_color").show();
                $("#r1_ev").html("");
            }
        }
        if (n_total > 9 ) {
            $("#n_color").html(n_total);
            $("#n_color").show();
        } else {
            if (n_total == 0) {
                $("#n_color").hide();
            } else {
                $("#n_color").show();
                $("#n_color").html("");
            }
        }
        if (i_total > 9 ) {
            $("#i_color").html(i_total);
            $("#i_color").show();
        } else {
            if (i_total == 0) {
                $("#i_color").hide();
            } else {
                $("#i_color").show();
                $("#i_color").html("");
            }
        }

        var total_e_votes = 0;

        for(var i in this.states) {
            total_e_votes += Number(this.states[i].e_votes);
        }

        var to_win = Math.floor((total_e_votes / 2) + 1);

        //Update Slider
        d_total = d1_total + d2_total + d4_total;
        r_total = r1_total + r2_total + r4_total;
        var d4_width = (d4_total/total_e_votes)*650;
        var d2_width = (d2_total/total_e_votes)*650;
        var d1_width = (d1_total/total_e_votes)*650;
        var r4_width = (r4_total/total_e_votes)*650;
        var r2_width = (r2_total/total_e_votes)*650;
        var r1_width = (r1_total/total_e_votes)*650;
        var t_width  = (t_total/total_e_votes)*650;
        var n_width  = (n_total/total_e_votes)*650;
        var i_width  = (i_total/total_e_votes)*650;

        $("#dem_ev").html(d_total);
        $("#rep_ev").html(r_total);
        $("#d4_color").css("width",Math.round(d4_width)+"px");
        $("#d2_color").css("width",Math.round(d2_width)+"px");
        $("#d1_color").css("width",Math.round(d1_width)+"px");
        $("#t_color" ).css("width",Math.round(t_width)+"px");
        $("#n_color" ).css("width",Math.round(n_width)+"px");
        $("#i_color" ).css("width",Math.round(i_width)+"px");
        $("#r1_color").css("width",Math.round(r1_width)+"px");
        $("#r2_color").css("width",Math.round(r2_width)+"px");
        $("#r4_color").css("width",Math.round(r4_width)+"px");

        if (d_total >= to_win) {
            $("#count_tri_down").attr("src", "/images/blue_triangle.png");
            $("#count_tri_up").attr("src", "/images/blue_triangle_up.png");

            $('#arrow-top').attr("fill", "#244999");
            $('#arrow-bottom').attr("fill", "#244999");
            $('#line-270').attr("fill", "#244999");
        } else if (r_total >= to_win) {
            $("#count_tri_down").attr("src","/images/red_triangle.png");
            $("#count_tri_up").attr("src", "/images/red_triangle_up.png");

            $('#arrow-top').attr("fill", "#D22532");
            $('#arrow-bottom').attr("fill", "#D22532");
            $('#line-270').attr("fill", "#D22532");
        } else if (i_total >= to_win) {
            $('#arrow-top').attr("fill", "#CCAD29");
            $('#arrow-bottom').attr("fill", "#CCAD29");
            $('#line-270').attr("fill", "#CCAD29");
        } else {
            $("#count_tri_down").attr("src", "/images/black_triangle.png");
            $("#count_tri_up").attr("src", "/images/black_triangle_up.png");

            $('#arrow-top').attr("fill", "black");
            $('#arrow-bottom').attr("fill", "black");
            $('#line-270').attr("fill", "black");
        }

        // D3 slider stuff
        $("#R_bar").css("width", r_total*1.02+'px');
        $("#D_bar").css("width", d_total*1.02+'px');
        $("#I_bar").css("width", i_total*1.02+'px');
        $("#U_bar").css("width", t_total*1.02+'px');

        $("#R_remain").css("width", 548.76 - r_total * 1.02 + 'px');  //275.4
        $("#D_remain").css("width", 548.76 - d_total * 1.02 + 'px');  //275.4
        $("#I_remain").css("width", 548.76 - i_total * 1.02 + 'px');  //275.4
        $("#R_remain").attr("x", r_total * 1.02 + 95);
        $("#D_remain").attr("x", d_total * 1.02 + 95);
        $("#I_remain").attr("x", i_total * 1.02 + 95);


        if (r_total > 19) {
            $("#R_ev").attr("x", "100px").attr("fill", "white");
        } else {
            $("#R_ev").attr("x", 100 + parseInt(r_total) + "px").attr("fill", "black");
        }
        if (d_total > 19) {
            $("#D_ev").attr("x", "100px").attr("fill", "white");
        } else {
            $("#D_ev").attr("x", 100 + parseInt(d_total) + "px").attr("fill", "black");
        }
        if (i_total > 19) {
            $("#I_ev").attr("x", "100px").attr("fill", "white");
        } else {
            $("#I_ev").attr("x", 100 + parseInt(i_total) + "px").attr("fill", "black");
        }
        /*
        if (t_total > 19) {
            $("#U_ev").attr("x", "100px").attr("fill", "white");
        } else {
            $("#U_ev").attr("x", 100 + parseInt(t_total) + "px").attr("fill", "black");
        }*/
        $("#U_ev").attr("x", 100 + "px").attr("fill", "#bbaa90");

        if (r_total == 0) $("#R_bar").css('width', '2px');
        if (d_total == 0) $("#D_bar").css('width', '2px');
        if (i_total == 0) $("#I_bar").css('width', '2px');
        if (t_total == 0) $("#U_bar").css('width', '2px');


        $("#R_ev").html(r_total);
        $("#D_ev").html(d_total);
        $("#I_ev").html(i_total);
        $("#U_ev").html(t_total);

        // Road to 270 Stuff
        if (r_total < 270 && d_total < 270 && t_states <= 12) {
            if (this.debug == 1) console.log("ROAD TO 270!!!");
        }
    }

    var settings = $('<div id="settings-modal" class="settings-modal-hidden">').html(`
    <div id="settings">
    <span class="close">Changes apply on close &times;</span>
    <div>Population Data:<label> <input id="census" type="radio" name="pop" value="census" checked />2010 Census</label> <label><input id="est" type="radio" name="pop" value="est" />2017 Estimate</label> <label><input id="pro" type="radio" name="pop" value="pro" /><abbr title="2020 Projection from Election Data Services, based on population changes from 2010 to 2017.">2020 Projection</abbr></label></div>

    <div><label># of Senators per State: <input id="senators" type="number" value="2" /></label></div>

    <div><label>Total # of House Reps: <input id="reps" type="number" value="435" /></label></div>

    <div><label><abbr title="If DC is not a state, this will give DC 3 electoral votes. If DC is a state, but the 23rd Amendment is not repealed, then the state will get its electors, and the 23rd Amendment electors will be allocated in some other way.">23<sup>rd</sup> Amendment</abbr>: <input id="a23" type="checkbox" checked /></label></div>

    <div><label>Total # of Electors: <input id="ev-total" type="number" value="538" disabled/></label></div>

    <div><label>Needed to Win: <input id="ev-needed" type="number" value="270" disabled/></label></div>

    <br />

    <table id="territories" class="display cell-border compact">
        <thead>
            <tr>
                <th>Name</th>
                <th>Abbr</th>
                <th class="cell-center">Is State?</th>
                <th>Census Pop</th>
                <th>2017 Est. Pop</th>
                <th>2020 Proj. Pop</th>
                <th>Electors</th>
                <th>Current Electors</th>
                <th>Change</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
        <tfoot>
            <tr id="a23-extra" class="settings-modal-hidden">
                <td><abbr title="Since DC is a state, but the 23rd Amendment hasn't been repealed, there are 3 extra Electors to allocate in some other way. One possibility is giving them to the nationwide popular vote winner.">Extra</abbr></td>
                <td>23<sup>rd</sup></td>
                <td class="cell-center">N/A</td>
                <td class="pop">N/A</td>
                <td class="pop">N/A</td>
                <td class="pop">N/A</td>
                <td id="EX-evs" class="cell-center">3</td>
                <td id="EX-evs-current" class="cell-center">0</td>
                <td id="EX-evs-change" class="cell-center" style="color: green;">+3</td>
            </tr>
            <tr style="display: none;">
                <td><input id="custom-name" /></td>
                <td><input id="custom-abbr" maxlength="2" /></td>
                <td></td>
                <td><input id="custom-census" class="pop" type="number" min="1" /></td>
                <td><input id="custom-est" class="pop" type="number" min="1" /></td>
                <td><input id="custom-pro" class="pop" type="number" min="1" /></td>
                <td colspan="3" class="cell-center"><button id="custom-submit">Add</button></td>
            </tr>
            <tr>
                <td>United States of America</td>
                <td>USA</td>
                <td class="cell-center">N/A</td>
                <td class="pop">312,913,872</td>
                <td class="pop">329,431,520</td>
                <td class="pop">337,866,086</td>
                <td id="USA-evs" class="cell-center">538</td>
                <td id="USA-evs-current" class="cell-center">538</td>
                <td id="USA-evs-change" class="cell-center">0</td>
            </tr>
        </tfoot>
    </table>
    </div>
    `);
    $('body').append(settings);

    $('#button_container > div:nth-child(2)').prepend($('<button id="settings_button" class="nice_button">').text('Settings'));
    var settingsShown = false;
    function toggleSettings() {
        if(settingsShown) {
            $('#settings-modal').addClass('settings-modal-hidden');
            $('#settings-modal').removeClass('settings-modal-shown');
        } else {
            $('#settings-modal').addClass('settings-modal-shown');
            $('#settings-modal').removeClass('settings-modal-hidden');
        }
        settingsShown = !settingsShown;
    }
    $('#settings_button').click(toggleSettings);
    $('.close').click(function() {
        toggleSettings();

        for(var tt in territories) {
            var t = territories[tt];
            console.log(t.fips);
            console.log(t.ev);
            m.states[t.fips].e_votes = t.ev.toString() | 0;

            if(t.fips == "23") {
                var atlarge = t.ev >= 4 ? t.ev - 2 : (t.ev == 3 ? 2 : t.ev);
                m.states[t.fips].MX.e_votes = atlarge;
                $('#sp_23_1').text('ME ' + atlarge);
                if(t.ev >= 4) {
                    $('#sp_23_4').text('1');
                    m.states[t.fips].M4.e_votes = 1;
                } else {
                    $('#sp_23_4').text('0');
                    m.states[t.fips].M4.e_votes = 0;
                }

                if(t.ev >= 3) {
                    $('#sp_23_3').text('1');
                    m.states[t.fips].M3.e_votes = 1;
                } else {
                    $('#sp_23_3').text('0');
                    m.states[t.fips].M3.e_votes = 0;
                }

                $(`.state_info:contains(${t.abbr})`).html(`${t.abbr}<br />${t.ev}`);
                if(t.ev == 0) {
                    $('#sp_23_1').parent().hide();
                    $('#23').hide();
                } else {
                    $('#sp_23_1').parent().show();
                    $('#23').show();
                }
            } else if(t.fips == "31") {
                var atlarge = t.ev >= 5 ? t.ev - 3 : (t.ev >=4 ? t.ev - 2 : (t.ev == 3 ? 2 : t.ev));
                m.states[t.fips].NX.e_votes = atlarge;
                $('#sp_31_1').text('NE ' + atlarge);

                if(t.ev >= 5) {
                    $('#sp_31_5').text('1');
                    m.states[t.fips].N5.e_votes = 1;
                } else {
                    $('#sp_31_5').text('0');
                    m.states[t.fips].N5.e_votes = 0;
                }

                if(t.ev >= 4) {
                    $('#sp_31_4').text('1');
                    m.states[t.fips].N4.e_votes = 1;
                } else {
                    $('#sp_31_4').text('0');
                    m.states[t.fips].N4.e_votes = 0;
                }

                if(t.ev >= 3) {
                    $('#sp_31_3').text('1');
                    m.states[t.fips].N3.e_votes = 1;
                } else {
                    $('#sp_31_3').text('0');
                    m.states[t.fips].N3.e_votes = 0;
                }

                $(`.state_info:contains(${t.abbr})`).html(`${t.abbr}<br />${t.ev}`);
                if(t.ev == 0) {
                    $('#sp_31_1').parent().hide();
                    $('#31').hide();
                } else {
                    $('#sp_31_1').parent().show();
                    $('#31').show();
                }
            } else if(['03', '14', '69', '72', '52', '99'].includes(t.fips)) {
                $('#sp_' + t.fips).text(t.ev);
                if(t.ev == 0) {
                    $('#sp_' + t.fips).hide();
                    $('#abbr_' + t.fips).hide();
                } else {
                    $('#sp_' + t.fips).show();
                    $('#abbr_' + t.fips).show();
                }
            } else if(m.specialStates.includes(t.fips)) {
                $('#sp_' + t.fips).text(t.ev);
                if(t.ev == 0) {
                    $('#sp_' + t.fips).parent().hide();
                    $('#' + t.fips).hide();
                } else {
                    $('#sp_' + t.fips).parent().show();
                    $('#' + t.fips).show();
                }
            } else if(t.fips == '15') {
                $(`.state_info:contains(HI)`).next().html(t.ev);
                if(t.ev == 0) {
                    $('#' + t.fips).hide();
                    $(`.state_info:contains(HI)`).hide();
                } else {
                    $('#' + t.fips).show();
                    $(`.state_info:contains(HI)`).show();
                }
            } else {
                $(`.state_info:contains(${t.abbr})`).html(`${t.abbr}<br />${t.ev}`);
                if(t.ev == 0) $('#' + t.fips).hide();
                else $('#' + t.fips).show();
            }
        }

        m.update_electoral_votes();
    });

    var temp = `
    <tr>
    <td>{0}</td>
    <td>{1}</td>
    <td class="cell-center"><input data-state="{1}" type="checkbox" {2}/></td>
    <td class="pop">{3}</td>
    <td class="pop">{4}</td>
    <td class="pop">{5}</td>
    <td id="{1}-evs" class="cell-center">{6}</td>
    <td id="{1}-evs-current" class="cell-center">{6}</td>
    <td id="{1}-evs-change" class="cell-center">0</td>
    </tr>
    `;

    for(var territory in territories) {
        if(territory == 56) continue;
        var t = territories[territory];
        t.ev = t.current_ev;

        var name = t.name;
        if(t.abbr === 'DC') {
        name = '<input id="DC-name" value="District of Columbia" disabled /><span id="DC-name-span">District of Columbia</span>';
        }

        var est = t.est.toLocaleString()
        if(['GU', 'VI', 'AS', 'MP'].includes(t.abbr)) {
            est = '<abbr title="No 2017 estimate, so 2010 census is used.">' + est + '</abbr>'
        }

        var pro = t.pro.toLocaleString()
        if(['GU', 'VI', 'AS', 'MP'].includes(t.abbr)) {
            pro = '<abbr title="No 2020 projection, so 2010 census is used.">' + pro + '</abbr>'
        } else if(t.abbr == 'PR') {
            pro = '<abbr title="No 2020 projection, so 2017 estimate is used.">' + pro + '</abbr>'
        }

        $('#territories > tbody').append(temp.formatUnicorn(
            name,
            t.abbr,
            t.is_state ? 'checked' : '',
            t.census.toLocaleString(),
            est,
            pro,
            t.current_ev
        ));
    }

    var table = $('#territories').DataTable({paging: false});
    //$('#territories').floatThead();

    var params = new URLSearchParams(window.location.search);
    var get_pop = ['1', null].includes(params.get('pop'));
    $('#census').prop('checked', get_pop);
    $('#est').prop('checked', !get_pop);
    var get_sen = Number(params.get('sen') || '2');
    $('#senators').val(get_sen);
    var get_rep = Number(params.get('rep') || '435');
    $('#reps').val(get_rep);
    var get_a23 = ['1', null].includes(params.get('a23'));
    $('#a23').prop('checked', get_a23);
    var get_states = params.get('states');

    if(/^[0-1]{56}$/.test(get_states)) {
        var get_states_split = get_states.split('');
        for(x in get_states_split) {
            var get_abbr = $('input[data-state=' + territories[x].abbr + ']');
            get_abbr.prop('checked', get_states_split[x] === '1');
            get_abbr.change();
        }
    } else {
        params.set('states', '11011111101101111111111111111111111110111101111101111111');
    }

    function change_electors() {
        console.log(`?${params}`)
        //top.history.replaceState({}, '', `${window.location.pathname}?${params}`);
        var senators = territories.filter(a => a.is_state).length * $('#senators').val();
        var reps = Number($('#reps').val())
        var ev = senators + reps + ($('#a23').prop('checked') ? 3 : 0);
        var needed = Math.floor((ev / 2) + 1);
        $('#USA-evs').text(ev);
        var change = ev - 538;
        $('#USA-evs-change').html('<span style="color: ' + (change>0?'green':(change<0?'red':'black')) + ';">' + (change>0?'+':'') + change + '</span>')
        $('#ev-total').val(ev);
        $('#ev-needed').val(needed);

        var states = [];

        for(var territory in territories) {
            if(territory == 56) continue;
            var t = territories[territory];
            if(t.is_state) {
                t.senators = Number($('#senators').val());
                t.reps = 1;
                t.ev = t.senators + 1;
                t.pop = $('#census').prop('checked') ? t.census : ($('#est').prop('checked') ? t.est : t.pro);
                states.push(t);
                if(t.abbr === 'DC') {
                    if($('#a23').prop('checked')) {
                        //$('#a23-extra').show();
                        $('#a23-extra').removeClass('settings-modal-hidden');
                        territories[56].ev = 3;
                    } else {
                        //$('#a23-extra').hide();
                        $('#a23-extra').addClass('settings-modal-hidden');
                        territories[56].ev = 0;
                    }
                }
            } else {
                t.senators = 0;
                t.reps = 0;
                if(t.abbr === 'DC') {
                    territories[56].ev = 0;
                    if($('#a23').prop('checked')) {
                        t.ev = 3;
                        //$('#a23-extra').hide();
                        $('#a23-extra').addClass('settings-modal-hidden');
                    } else {
                        t.ev = 0
                    }
                } else {
                    t.ev = 0;
                }
            }
        }

        for(var i = states.length + 1; i < reps + 1; i++) {
            var highest = {priority: -1};
            for(n in states) {
                var state = states[n];
                state.priority = state.pop / Math.sqrt(state.reps * (state.reps + 1));
                if(state.priority > highest.priority) {
                    highest = state;
                }
            }
            highest.reps++;
            highest.ev++;
        }

        for(var n in territories) {
            var t = territories[n];
            $('#' + t.abbr + '-evs').text(t.ev);
            change = t.ev - t.current_ev
            $('#' + t.abbr + '-evs-change').html('<span style="color: ' + (change>0?'green':(change<0?'red':'black')) + ';">' + (change>0?'+':'') + change + '</span>');
        }

        table.cells().invalidate();
        table.cells().draw();
    }

    change_electors();

    $('#senators').change(function() {
        params.set('sen', $(this).val());
        change_electors();
    });

    $('#reps').change(function() {
        params.set('rep', $(this).val());
        change_electors();
    });

    $('#a23').change(function() {
        params.set('a23', $(this).prop('checked') ? '1' : '0');
        change_electors();
    });

    $('#census').change(function() {
        params.set('pop', '1');
        change_electors();
    });
    $('#est').change(function() {
        params.set('pop', '0');
        change_electors();
    });
    $('#pro').change(function() {
        params.set('pop', '0');
        change_electors();
    });

    $('input[data-state]').change(function() {
        if($(this).data('state') === 'DC') {
            var dc_statehood = $(this).prop('checked');
            $('#DC-name').prop('disabled', !dc_statehood);
            territories[9].is_state = dc_statehood;
            if(!dc_statehood) {
                $('#DC-name').val('District of Columbia');
                $('#DC-name').change();
            }
            var state_param = params.get('states');
            state_param = state_param.split('');
            state_param[9] = dc_statehood ? '1' : '0';
            params.set('states', state_param.join(''));
            //$('#DC-name').toggle();
            //$('#DC-name-span').toggle();
            change_electors();
            return;
        }

        for(var territory in territories) {
            if(territory == 56) continue;
            var t = territories[territory];
            if(t.abbr === $(this).data('state')) {
                t.is_state = $(this).prop('checked');
                var state_param = params.get('states');
                state_param = state_param.split('');
                state_param[territory] = $(this).prop('checked') ? '1' : '0';
                params.set('states', state_param.join(''));
                break;
            }
        }
        change_electors();
    });

    $('#DC-name').change(function() {
        name = $(this).val();
        territories[9].name = name;
        $(this).next().text(name);
        table.cells().invalidate();
        table.cells().draw();
    });
})();