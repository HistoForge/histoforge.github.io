# Add a processing script

A processing script runs inside QuPath at its position in the recipe. It can read the supplied
objects and change their classifications. For example, it can flag large objects for review or
select structures for a later model.

These scripts use **Groovy**, a scripting language available in QuPath. They are not Python model
code. HistoForge supplies their inputs when it runs the recipe; pasting the file into QuPath's
script editor does not supply those inputs.

## Flag objects for review

Continue with the copy from [Create your first module](first-module.md). Save this complete script
as `review_objects.groovy` at the repository root:

```{literalinclude} ../../examples/module-authoring/review_objects.groovy
:language: groovy
```

Replace `Object` and `Object (Review)` with your actual source class and chosen review label,
including the label in the first comment. The 400 µm² threshold is an example to demonstrate the
script, not a biological criterion.

The first comment declares the new class the script may assign. `children` contains the eligible
objects supplied at this point in the recipe. The script selects both original and previously
flagged objects, calculates each area in µm², and assigns the appropriate class. Including both
classes lets another run remove a flag if an object's area or the threshold has changed.

Keep your existing steps. Insert `review_objects.groovy` after the models whose objects it
processes and before `metrics.groovy`. For a module containing only the `objects` model, the list
would be:

```json
[
  { "model": "objects" },
  { "script": "review_objects.groovy" },
  { "script": "metrics.groovy" }
]
```

The first guide's count selects only the original class. Once objects are reclassified, that
count excludes them. Update the measurements to include both classes, as shown in
[Add measurements](measurements.md).

## What the script may change

HistoForge supplies detached copies, not the live project objects. A script may assign classes
from earlier model outputs or its own `@histoforge-classes` header. Another script's header does
not grant that permission. Do not add or delete objects, change outlines or hierarchy, write
object measurements, or replace the supplied variables. HistoForge rejects these changes.

That restriction is not a security sandbox. Groovy scripts run with QuPath's access to files and
the network. Avoid external side effects and review any script you copy.

Use the [Script functions reference](../reference/script-functions.md) for supplied variables,
object selection and geometry functions. Then [reinstall and test](test-and-share.md), including
two consecutive runs and an empty object list.
