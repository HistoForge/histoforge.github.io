// Run with the chosen QuPath/Groovy dependencies and compiled HistoForge helpers.
// This tests the exact files included in the guides, not an installed cloud workflow.
import qupath.ext.histoforge.pipeline.ScriptBindings
import qupath.lib.objects.PathObjects
import qupath.lib.objects.classes.PathClass
import qupath.lib.regions.ImagePlane
import qupath.lib.roi.ROIs

def examples = new File(args[0], "examples/module-authoring")
def countSource = new File(examples, "count/metrics.groovy").getText("UTF-8")
def measurementSource = new File(examples, "measurements/metrics.groovy").getText("UTF-8")
def reviewSource = new File(examples, "review_objects.groovy").getText("UTF-8")
def plane = ImagePlane.getDefaultPlane()
def object = { width, height, label ->
    PathObjects.createDetectionObject(
        ROIs.createRectangleROI(0, 0, width, height, plane), PathClass.fromString(label))
}
def run = { source, objects ->
    def binding = new Binding()
    ScriptBindings.applyCommon(binding, objects, 100000.0d, 0.5d, 0.5d)
    binding.setVariable("roi", PathObjects.createAnnotationObject(
        ROIs.createRectangleROI(0, 0, 1000, 100, plane)))
    new GroovyShell(binding).evaluate(source)
}

def objects = [object(20, 20, "Object"), object(20, 60, "Object")]
assert run(countSource, objects) == [object_count: 2]
assert run(measurementSource, objects) == [object_count: 2, object_area: [100.0d, 300.0d]]
assert run(countSource, []) == [object_count: 0]
assert run(measurementSource, []) == [object_count: 0, object_area: []]
assert run(countSource, [object(20, 20, "Other")]) == [object_count: 0]

objects += object(40, 40, "Object")
def originalRois = objects.collect { it.getROI() }
def originalIds = objects.collect { it.getID() }
run(reviewSource, objects)
assert objects.collect { it.getPathClass().toString() } == ["Object", "Object", "Object (Review)"]
run(reviewSource, objects)
assert objects.collect { it.getPathClass().toString() } == ["Object", "Object", "Object (Review)"]
assert objects.collect { it.getROI() } == originalRois
assert objects.collect { it.getID() } == originalIds
assert run(countSource, objects) == [object_count: 2]
assert run(measurementSource, objects) == [object_count: 3, object_area: [100.0d, 300.0d, 400.0d]]

// A changed review threshold must be able to restore previously flagged objects.
run(reviewSource.replace("400.0d", "500.0d"), objects)
assert objects.every { it.getPathClass().toString() == "Object" }
run(reviewSource, [])
println("Authoring scripts passed: counts, areas, empty inputs, class filters, threshold boundary, repeat runs and flag removal.")
