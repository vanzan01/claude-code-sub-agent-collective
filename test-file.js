const express = require('express');
const broken = require('./non-existent'); // broken import on line 2

function test() {
    return 'hello';
}