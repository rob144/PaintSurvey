import json

def dictToHtmlTable(dict, cssClass):
    html = "<table class='" + cssClass + "'><tr>"
    #Build html table from dict with data in columns
    for key, value in dict.iteritems():
        html += "<th>" + str(key) + "</th>"
    html += "</tr><tr>"
    for key, value in dict.iteritems():
        html += "<td>" + str(value) + "</td>"
    return html + "</tr></table>"

def listToHtmlTable(list, cssClass):
    html = "<table class='" + cssClass + "'><tr>"

    if(len(list) >= 1):
        for key in list[0]:
            html += "<th>" + str(key) + "</th>"
        html += "</tr>"

        for item in list:
            dataRow = "<tr>"

            for key, value in item.iteritems():
                strItem = str(value)

                try:
                    strItem = json.dumps(value, sort_keys=True, indent=2, separators=(',', ': '))
                except TypeError:
                    print("type error.")

                dataRow += "<td>" + strItem + "</td>"
            dataRow += "</tr>"
            html += dataRow

    return html + "</table>"
