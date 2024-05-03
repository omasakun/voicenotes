buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath("com.android.tools.build:gradle:8.4.0")
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.6.21")
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
  }
}

tasks.register("clean").configure { delete("build") }
