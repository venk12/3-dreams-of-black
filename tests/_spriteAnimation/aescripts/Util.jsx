﻿Util = {};Util.getLayerType = function(ly) {   if(ly instanceof CameraLayer) return "Camera";   else if(ly instanceof TextLayer) return "Text";   else if(ly instanceof LightLayer) return "Light";   else if(ly instanceof AVLayer) return "AV";   else return "Unknown";}Util.cleanName = function(n){    return n.toLowerCase().replace (".", "_").replace ("-", "_").replace (" ", "_").replace ("[", "").replace ("]", "_");}Util.selectFile = function(){    var sf = File.saveDialog ("Export JSON");    sf.encoding = "ASCII";    sf.lineFeed = "Unix";    sf.open("w:");    return sf;}Util.adaptPosition = function(p) {    p[1] *= -1;    p[2] *= -1;    return p;}Util.adaptScale = function(p) {    p[0] *= 0.01;    p[1] *= 0.01;    p[2] *= 0.01;    return p;}Util.adaptRotation = function(p) {    p[0] *= Math.PI/180;    p[1] *= -Math.PI/180;    p[2] *= -Math.PI/180;    return p;}