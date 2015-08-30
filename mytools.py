#Need to deal with lists of dicts as well

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
    for key in list[0]:
        html += "<th>" + str(key) + "</th>"
    html += "</tr>"
    for item in list:
        dataRow = "<tr>"
        for key, value in item.iteritems():
            dataRow += "<td>" + str(value) + "</td>"
        dataRow += "</tr>"
        html += dataRow
    return html + "</table>"
