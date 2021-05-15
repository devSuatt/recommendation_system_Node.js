
const showHomePage = (req, res, next) => {
    res.render('index', { layout: './layout/management_layout.ejs' });
    next();
};

const showImportPage = (req, res, next) => {
    res.render('import_file', { layout: './layout/management_layout.ejs' });
    next();
};

module.exports = {
    showHomePage,
    showImportPage
}