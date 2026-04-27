

const cleanFont = new opentype.Font({
    familyName: newFamilyName || "Font",
    styleName: newStyleName,
    designer: "Who?",
    unitsPerEm: font.unitsPerEm || 1000,
    ascender: font.ascender || 800,
    descender: font.descender || -200,
    glyphs: finalGlyphs
});

console.log("CFONT_DATA", cleanFont.names);
        
windows: 
copyright: {en: ' '}
description: {en: ' '}
designer: {en: 'Who?'}
designerURL: {en: ' '}
fontFamily: {en: 'Generated'}
fontSubfamily: {en: 'Medium'}
fullName: {en: 'Generated Medium'}
license: {en: ' '}
licenseURL: {en: ' '}
manufacturer: {en: ' '}
manufacturerURL: {en: ' '}
postScriptName: {en: 'GeneratedMedium'}
preferredFamily: {en: 'Generated'}
preferredSubfamily: {en: 'Medium'}
trademark: {en: ' '}
uniqueID: {en: ' : Generated Medium'}
version: {en: 'Version 0.1'}