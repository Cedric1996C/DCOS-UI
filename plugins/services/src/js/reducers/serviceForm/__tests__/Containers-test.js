const Containers = require("../Containers");
const Batch = require("#SRC/js/structs/Batch");
const Transaction = require("#SRC/js/structs/Transaction");
const {
  ADD_ITEM,
  SET,
  REMOVE_ITEM
} = require("#SRC/js/constants/TransactionTypes");
const { DEFAULT_POD_CONTAINER } = require("../../../constants/DefaultPod");

describe("Containers", function() {
  describe("#JSONReducer", function() {
    it("should pass through state as default", function() {
      const batch = new Batch();

      expect(batch.reduce(Containers.JSONReducer.bind({}), [])).toEqual([]);
    });

    it("returns an array as default with a container path Transaction", function() {
      let batch = new Batch();
      batch = batch.add(
        new Transaction(["containers"], DEFAULT_POD_CONTAINER, ADD_ITEM)
      );

      expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
        DEFAULT_POD_CONTAINER
      ]);
    });

    describe("container with image", function() {
      it("contains a container with image", function() {
        let batch = new Batch();

        batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));
        batch = batch.add(
          new Transaction(["containers", 0, "image", "id"], "alpine", SET)
        );

        expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
          {
            name: "container-1",
            image: {
              kind: "DOCKER",
              id: "alpine"
            },
            resources: {
              cpus: 0.1,
              mem: 128
            }
          }
        ]);
      });

      it("doesn't contain the image object", function() {
        let batch = new Batch();

        batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));
        batch = batch.add(
          new Transaction(["containers", 0, "image", "id"], "alpine", SET)
        );

        // This is here to ensure that both image id changes are in the batch.
        batch = batch.add(
          new Transaction(["containers", 0, "resources", "cpus"], 0.2, SET)
        );

        batch = batch.add(
          new Transaction(["containers", 0, "image", "id"], "", SET)
        );

        expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
          {
            name: "container-1",
            resources: {
              cpus: 0.2,
              disk: "",
              mem: 128
            }
          }
        ]);
      });
    });

    describe("endpoints", function() {
      describe("Host Mode", function() {
        it("should have one endpoint", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  hostPort: 0,
                  labels: null,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: "foo",
                  hostPort: 0,
                  labels: null,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should keep custom labels", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));
          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );
          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "labels"], {
              custom: "label"
            })
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  hostPort: 0,
                  labels: { custom: "label" },
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name and a hostport", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "HOST"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "automaticPort"],
              false
            )
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "hostPort"], 8080)
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: "foo",
                  hostPort: 8080,
                  labels: null,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should set the protocol right", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "HOST"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "udp"],
              true
            )
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  hostPort: 0,
                  labels: null,
                  protocol: ["tcp", "udp"]
                }
              ]
            }
          ]);
        });

        it("should set protocol to unknown value", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "HOST"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "foo"],
              true
            )
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  hostPort: 0,
                  labels: null,
                  protocol: ["tcp", "foo"]
                }
              ]
            }
          ]);
        });
      });

      describe("container Mode", function() {
        it("should have one endpoint", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  hostPort: 0,
                  containerPort: null,
                  labels: null,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: "foo",
                  containerPort: null,
                  labels: null,
                  hostPort: 0,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should keep custom labels", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));
          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );
          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "labels"], {
              custom: "label"
            })
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  hostPort: 0,
                  containerPort: null,
                  labels: { custom: "label" },
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name and a hostport", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "automaticPort"],
              false
            )
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "hostPort"], 8080)
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: "foo",
                  containerPort: null,
                  labels: null,
                  hostPort: 8080,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should set the protocol right", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "udp"],
              true
            )
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  containerPort: null,
                  labels: null,
                  hostPort: 0,
                  protocol: ["tcp", "udp"]
                }
              ]
            }
          ]);
        });

        it("should set protocol to unknown value", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "foo"],
              true
            )
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  containerPort: null,
                  labels: null,
                  hostPort: 0,
                  protocol: ["tcp", "foo"]
                }
              ]
            }
          ]);
        });

        it("should set the right container Port", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  containerPort: 8080,
                  labels: null,
                  hostPort: 0,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should set the right vip", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  containerPort: 8080,
                  labels: {
                    VIP_0: "/foobar:8080"
                  },
                  hostPort: 0,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should set the right custom vip", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "vip"],
              "1.3.3.7:8080"
            )
          );

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  containerPort: 8080,
                  labels: {
                    VIP_0: "1.3.3.7:8080"
                  },
                  hostPort: 0,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should set the right vip after id change", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          batch = batch.add(new Transaction(["id"], "/barfoo"));

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  containerPort: 8080,
                  labels: {
                    VIP_0: "/barfoo:8080"
                  },
                  hostPort: 0,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });

        it("should set the right custom vip even after id change", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "vip"],
              "1.3.3.7:8080"
            )
          );

          batch = batch.add(new Transaction(["id"], "/barfoo"));

          expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  name: null,
                  containerPort: 8080,
                  labels: {
                    VIP_0: "1.3.3.7:8080"
                  },
                  hostPort: 0,
                  protocol: ["tcp"]
                }
              ]
            }
          ]);
        });
      });
    });

    describe("artifacts", function() {
      it("omits artifacts with empty uris", function() {
        const batch = new Batch([
          new Transaction(["containers"], null, ADD_ITEM),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM),
          new Transaction(
            ["containers", 0, "artifacts", 0, "uri"],
            "http://mesosphere.io",
            SET
          ),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM),
          new Transaction(
            ["containers", 0, "artifacts", 2, "uri"],
            "http://mesosphere.com",
            SET
          ),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM)
        ]);

        expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
          {
            artifacts: [
              { uri: "http://mesosphere.io" },
              { uri: "http://mesosphere.com" }
            ],
            name: "container-1",
            resources: {
              cpus: 0.1,
              mem: 128
            }
          }
        ]);
      });
    });

    describe("volumes", function() {
      it("removes volumeMounts when there's no volumes left", function() {
        const batch = new Batch([
          new Transaction(["containers"], null, ADD_ITEM),
          new Transaction(["volumeMounts"], null, ADD_ITEM),
          new Transaction(["volumeMounts", 0, "name"], "extvol", SET),
          new Transaction(["volumeMounts", 0, "mountPath"], null, ADD_ITEM),
          new Transaction(["volumeMounts", 0, "mountPath", 0], "mount", SET),
          new Transaction(["volumeMounts"], 0, REMOVE_ITEM)
        ]);

        expect(batch.reduce(Containers.JSONReducer.bind({}))).toEqual([
          {
            name: "container-1",
            resources: {
              cpus: 0.1,
              mem: 128
            },
            volumeMounts: []
          }
        ]);
      });
    });
  });

  describe("#JSONParser", function() {
    it("keeps random value", function() {
      expect(
        Containers.JSONParser({
          containers: [
            {
              Random: "value"
            }
          ]
        })
      ).toEqual([
        new Transaction(
          ["containers"],
          {
            Random: "value"
          },
          ADD_ITEM
        )
      ]);
    });
    describe("artifacts", function() {
      it("parses JSON correctly", function() {
        expect(
          Containers.JSONParser({
            containers: [
              {
                artifacts: [
                  { uri: "http://mesosphere.io" },
                  null,
                  { uri: "http://mesosphere.com" }
                ]
              }
            ]
          })
        ).toEqual([
          new Transaction(
            ["containers"],
            {
              artifacts: [
                { uri: "http://mesosphere.io" },
                null,
                { uri: "http://mesosphere.com" }
              ]
            },
            ADD_ITEM
          ),
          new Transaction(
            ["containers", 0, "artifacts"],
            { uri: "http://mesosphere.io" },
            ADD_ITEM
          ),
          new Transaction(
            ["containers", 0, "artifacts", 0, "uri"],
            "http://mesosphere.io",
            SET
          ),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM),
          new Transaction(
            ["containers", 0, "artifacts"],
            { uri: "http://mesosphere.com" },
            ADD_ITEM
          ),
          new Transaction(
            ["containers", 0, "artifacts", 2, "uri"],
            "http://mesosphere.com",
            SET
          )
        ]);
      });
    });
  });

  describe("#FormReducer", function() {
    describe("endpoints", function() {
      describe("Host Mode", function() {
        it("should have one endpoint", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: "foo",
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name and a hostport", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "automaticPort"],
              false
            )
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "hostPort"], 8080)
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: false,
                  hostPort: 8080,
                  labels: null,
                  name: "foo",
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should set the protocol right", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "HOST"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "udp"],
              true
            )
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: true
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should set protocol to unknown value", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "HOST"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "foo"],
              true
            )
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false,
                    foo: true
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });
      });

      describe("container Mode", function() {
        it("should have one endpoint", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: "foo",
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should have one endpoint with name and a hostport", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "name"], "foo")
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "automaticPort"],
              false
            )
          );

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints", 0, "hostPort"], 8080)
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: false,
                  hostPort: 8080,
                  labels: null,
                  name: "foo",
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should set the protocol right", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "udp"],
              true
            )
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: true
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should set protocol to unknown value", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "protocol", "foo"],
              true
            )
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    foo: true,
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: null
                }
              ]
            }
          ]);
        });

        it("should set the right container Port", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: false,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: 8080
                }
              ]
            }
          ]);
        });

        it("should set the right vip", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: true,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: 8080
                }
              ]
            }
          ]);
        });

        it("should set the right custom vip", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "vip"],
              "1.3.3.7:8080"
            )
          );

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: true,
                  vip: "1.3.3.7:8080",
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: 8080
                }
              ]
            }
          ]);
        });

        it("should set the right vip after id change", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          batch = batch.add(new Transaction(["id"], "/barfoo"));

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: true,
                  vip: null,
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null,
                  containerPort: 8080
                }
              ]
            }
          ]);
        });

        it("should set the right custom vip even after id change", function() {
          let batch = new Batch();

          batch = batch.add(new Transaction(["containers"], null, ADD_ITEM));

          batch = batch.add(new Transaction(["networks", 0], "CONTAINER.foo"));
          batch = batch.add(new Transaction(["id"], "/foobar"));

          batch = batch.add(
            new Transaction(["containers", 0, "endpoints"], null, ADD_ITEM)
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "containerPort"],
              "8080"
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "loadBalanced"],
              true
            )
          );

          batch = batch.add(
            new Transaction(
              ["containers", 0, "endpoints", 0, "vip"],
              "1.3.3.7:8080"
            )
          );

          batch = batch.add(new Transaction(["id"], "/barfoo"));

          expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
            {
              name: "container-1",
              resources: {
                cpus: 0.1,
                mem: 128
              },
              endpoints: [
                {
                  automaticPort: true,
                  hostPort: null,
                  labels: null,
                  name: null,
                  loadBalanced: true,
                  containerPort: 8080,
                  vip: "1.3.3.7:8080",
                  protocol: {
                    tcp: true,
                    udp: false
                  },
                  servicePort: null
                }
              ]
            }
          ]);
        });
      });
    });

    describe("artifacts", function() {
      it("emits correct form data", function() {
        const batch = new Batch([
          new Transaction(["containers"], null, ADD_ITEM),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM),
          new Transaction(
            ["containers", 0, "artifacts", 0, "uri"],
            "http://mesosphere.io",
            SET
          ),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM),
          new Transaction(
            ["containers", 0, "artifacts", 1, "uri"],
            "http://mesosphere.com",
            SET
          ),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM),
          new Transaction(["containers", 0, "artifacts"], null, ADD_ITEM)
        ]);

        expect(batch.reduce(Containers.FormReducer.bind({}))).toEqual([
          {
            artifacts: [
              { uri: "http://mesosphere.io" },
              { uri: "http://mesosphere.com" },
              { uri: null },
              { uri: null }
            ],
            name: "container-1",
            resources: {
              cpus: 0.1,
              mem: 128
            }
          }
        ]);
      });
    });
  });
});
