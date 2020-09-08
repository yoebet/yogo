pushd /ws/workspace/go
mvn clean
mvn package
cp target/go/js/yogo.min.js /ws/tool/yogo
popd
ls -l js-dist
