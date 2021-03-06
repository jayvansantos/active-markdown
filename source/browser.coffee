###
Browser-specific functionality.
###

_   = require 'underscore'
_s  = require 'underscore.string'

ActiveMarkdown  = require './ActiveMarkdown'
Controls        = require './Controls'
Executor        = require './Executor'
DragManager     = require './DragManager'

ActiveCodeBlock = require './elements/ActiveCodeBlock'
ChartElement    = require './elements/ChartElement'
RangeElement    = require './elements/RangeElement'
StringElement   = require './elements/StringElement'
SwitchElement   = require './elements/SwitchElement'


# TODO: Have these listen to events from the elements, instead of needing
# to be global.
window.executor = new Executor()
window.drag_manager = new DragManager()

ActiveMarkdown.makeActive = (options) ->
    ActiveMarkdown.options = options

    controls = new Controls
        el              : $('#AMControls')
        collapsed_code  : options.collapsed_code
        filename        : options.filename

    $('pre').each (i, el) ->
        $el = $(el)
        $code = $el.find('code')
        if not $code.attr('class')
            source = $code.text()
            $new_el = $('<div>')
            $el.replaceWith($new_el)
            executor.addCodeBlock new ActiveCodeBlock
                el              : $new_el
                source          : source

    $('.AMElement').each (i, el) ->
        $el = $(el)
        config_str = $el.data('config')
        embed_flag = $el.data('embed')

        element_classes = [
            ChartElement
            SwitchElement
            RangeElement
            StringElement
        ]

        element_class = _.find element_classes, (cls) ->
            return cls.config_pattern.test(config_str) and cls.is_embed is embed_flag

        if element_class?
            element_class.make($el, config_str)
        else
            console.error 'Unable to make element for', $el
            if options.debug
                $el.addClass('error')
                $el.append """
                        <span class="error-feedback">
                            Unable to make element:<br><span class="config-string">{#{ config_str }}</span>
                        </span>
                    """


# Unescape the raw source.
$('#AMRaw').text(unescape($('#AMRaw').text()))


# Add section links to each heading, updating the ids with a counter if
# necessary to ensure each one is unique.
heading_counts = {}
$('h1, h2, h3, h4, h5, h6').each (i, el) ->
    $el = $(el)

    id = _s.slugify(_s.words(el.innerText).join('-'))
    heading_counts[id] ?= 0
    heading_counts[id] += 1

    if heading_counts[id] > 1
        id = "#{id}-#{heading_counts[id]}"

    el.id = id
    $el.prepend """
        <a class="section-link" href="##{id}">#</a>
    """

window.ActiveMarkdown = ActiveMarkdown