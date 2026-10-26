/* @histoforge-classes
["Object (Review)"]
*/
import qupath.lib.objects.classes.PathClass

def originalClass = PathClass.fromString("Object")
def reviewClass = PathClass.fromString("Object (Review)")
def thresholdUm2 = 400.0d
def objects = children.findAll {
    it.getPathClass() == originalClass || it.getPathClass() == reviewClass
}

objects.each { object ->
    def areaUm2 = m.area(object) * pixelWidthMicrons * pixelHeightMicrons
    object.setPathClass(areaUm2 >= thresholdUm2 ? reviewClass : originalClass)
}
