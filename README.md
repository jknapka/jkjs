# The JK Javascript framework.

I needed editable, persistent HTML data tables for a small webapp project.
It seemed obvious that the way to implement that was via an AJAX-y mechanism.
Since I was just getting into Javascript I did not want to depend
on an existing framework such as Angular for data binding. Rather, I
wanted to see how to implement data binding myself, so that when I need
to move to a mainstream framework I'll understand how they work. This
project is the result of that effort.

Conveniently, I have complete control over both the front end and back
end (a TurboGears 2.x web service). I tried to make the front-end code
as simple as possible, and require a pretty minimal API on the server
side to process data updates. The URL to invoke on the server is
set by adding a `data-edit-url` attribute to the `<table>` tag, whose value
is the base URL to call on the server to update data. The primary key
name and value to append to the query for a particuler `<td>` cell are
set by the `data-key-name` and `data-key-id` attributes on the `<tr>` tag.
The `data-key-name` attribute may also be set on the table, if that's
more convenient, since usually the key name is the same for all rows
in the table. Each `<td>` tag containing editable content needs a
`data-jkspa-data-attribute` attribute indicating the name of the
data item (essentially, the table column) to update when the cell is
edited. The URL invoked on the server will be of the form

```
    /baseUrl?keyName=keyId&attributeName=newValue
```

When a `<td>` element is clicked/tapped, the handler looks for a
`data-jkspa-control-id` attribute on the `<td>`. If found, it
takes the value of that attribute to be the name of a template
element to manifest as an editor control overlaid atop the `<td>`.
The editor templates are realized as `<script type="text/jkjs-template">`
tags whose contents are the editor's HTML code. Each template
tag may also have an associated Javascript controller function,
whose name is specified by a `data-jkspa-js-controller` attribute
to the HTML element within the `<script>` tag. If no such function
is named, a default controller function will be used depending
on the type of HTML tag the editor uses. Currently only text
`<input>` tags and `<select>` tags are supported as editors using
the default controller functions. See the `jkspaTextController()`
and `jkspaSelectController()` functions if you want to implement
a new controller function.

The controller function binds approporate behavior to the editor's
HTML to allow changes to be commited to the server via XMLHttpRequest
calls to the URL scheme described above. The result of each such
call must be JSON that contains the new state of the table.

After submitting a successful update, the server should return
whatever JSON data the configured renderer function needs in order
to render the updated data. Renderer functions may be configured
by calling `JKJS.registerRefreshFunction(htmlName,your_render_fn)`,
where `htmlName` is the a name by which the render function will
be referred to in the `<table data-jkspa-refresh-fn="htmlName">`
attribute. (That attribute may also be specified at the `<tr>`
level if different rows require different render functions.) The
render function is passed the JSON data returned from the server's
update call.

In the near future I will add a brief example app.
