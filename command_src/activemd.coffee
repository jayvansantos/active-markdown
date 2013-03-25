fs          = require 'fs-extra'
path        = require 'path'
Showdown    = require 'showdown'

CWD = process.cwd()
LIB_PATH = path.dirname(fs.realpathSync(__filename))

assembleViewer = (opts) ->
    { input_file_name, inline, markup} = opts

    if inline
        styles  = readLibFile('activemarkdown.css')
        scripts = readLibFile('activemarkdown.js')
        styles  = "<style>#{ styles }</style>"
        scripts = "<script>#{ scripts }</script>"
    else
        styles  = "<link rel='stylesheet' href='activemarkdown.css'>"
        scripts = "<script src='activemarkdown.js'></script>"

    compiled_template = readLibFile('template.js')
    template_fn = Function(compiled_template)

    now = (new Date()).toISOString()

    markup_output = """<!--
            This file was generated by Active Markdown - http://activemarkdown.org

            #{input_file_name} - #{now}
            -->\n
        """

    markup_output += template_fn.call
        page_title  : input_file_name
        styles      : styles
        script      : scripts
        markup      : markup


    return markup_output




readLibFile = (name) ->
    return fs.readFileSync(path.join(LIB_PATH, name), 'utf-8').toString()



outputCompiledFile = (input_file_name, markup, inline=false) ->

    html_output = assembleViewer
        input_file_name     : input_file_name
        inline              : inline
        markup              : markup

    if process.stdout.isTTY
        path_components = input_file_name.split('.')
        path_components.pop()
        path_components.push('html')
        output_file_path = path_components.join('.')
        output_file_path = path.join(CWD, output_file_path)
        console.log output_file_path
        fs.writeFileSync(output_file_path, html_output, 'utf-8')
    else
        process.stdout.write(html_output)



processMarkdown = (markdown_source) ->
    # preprocess
    pure_markdown = markdown_source
    converter = new Showdown.converter()
    markup = converter.makeHtml(pure_markdown)
    return markup




doCompileFile = (options, args) ->
    console.log 'compiling the file!'

    if process.stdin.isTTY
        input_file_name = args[0]
        source_file = path.join(CWD, input_file_name)
        markdown_source = fs.readFileSync(source_file, 'utf-8')
        markup = processMarkdown(markdown_source)
        outputCompiledFile(input_file_name, markup)
    else
        process.stdin.resume()
        process.stdin.setEncoding('utf8')

        markdown_source = ''
        process.stdin.on 'data', (chunk) ->
            markdown_source += chunk

        process.stdin.on 'end', ->
            markup = processMarkdown(markdown_source)
            outputCompiledFile('stdin', markup)





doGenerateSample = ->
    console.log 'generating sample!'



exports.run = (args, options) ->
    console.log args, options

    if options.sample
        doGenerateSample()
    else
        doCompileFile(options, args)


