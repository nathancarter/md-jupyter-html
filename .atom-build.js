
// Load necessary node modules
const fs = require( 'fs' );
const path = require( 'path' );

// Global variable for storing which editor invoked the build
var whereIWas;

// Define the build process attributes
module.exports = {
    name : 'Build HTML from Markdown (by jupytext and nbconvert)',

    // We will run the make command, which will necessitate our
    // having a Makefile...we'll solve that need below.
    cmd : 'make',

    // Pass it the following command-line parameters:
    args : [
        // A custom Makefile we will define below
        '-f .atom-build.Makefile',
        // A target output file based on the current editor's file
        '{FILE_ACTIVE_NAME_BASE}.html'
    ],

    // Before we run the build command given above, do two things:
    preBuild : function () {

        // 1. We better have a Makefile in place to use.
        //    So let's ensure there's one on disk.
        //    We define it in a variable later in this
        //    file, and save it to disk here.
        const makefile = path.resolve(
            __dirname, '.atom-build.Makefile' );
        if ( !fs.existsSync( makefile ) )
            fs.writeFileSync( makefile, Makefile );

        // 2. Remember where my cursor/focus was,
        //    so that we can put it back after the build.
        whereIWas = atom.workspace.getActivePane();

    },

    // After the build, we open an HTML view showing the results.
    postBuild : function ( success, stdout, stderr ) {

        // We need the working directory to find the file...
        if ( atom.project.getPaths().length === 0 ) return;

        // The Makefile prints out what it built, in the following
        // format, so we can extract the build target from there:
        const filename = /BUILDING: (.*)\n/.exec( stdout );
        if ( !filename ) return;

        // Convert that to an absolute file:// URL:
        const fullname = path.resolve(
            atom.project.getPaths()[0], filename[1] );
        const url = `file://${fullname}`;

        // Open that URL in the current Atom workspace,
        // which will invoke browser-plus:
        atom.workspace.open( url, {
            // Please open it in a split view to the right
            split : 'right'
        } ).then( function ( browser ) {
            // It may have already been open, in which case we
            // will want to ensure it gets refreshed
            browser.refresh();
            // Then put the cursor/focus back where it was
            if ( whereIWas ) whereIWas.activate();
        } );

    }

};

// The Makefile that gets invoked is defined below.
const Makefile = `
$(info BUILDING: $(MAKECMDGOALS))
%.html: %.md
	jupytext --to notebook --output - $< | \
    jupyter nbconvert --execute --allow-errors -y --stdin \
        --to=html --output=$@
`;

